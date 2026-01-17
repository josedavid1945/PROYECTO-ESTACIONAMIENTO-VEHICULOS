package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/josedavid1945/estacionamiento-websocket/internal/domain/models"
)

// RestClient cliente HTTP para comunicarse con el REST API
type RestClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewRestClient crea una nueva instancia del cliente REST
func NewRestClient(baseURL string) *RestClient {
	return &RestClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetDashboardData obtiene los datos del dashboard construyéndolos desde endpoints existentes
func (c *RestClient) GetDashboardData() (*models.DashboardData, error) {
	// Obtener espacios disponibles y ocupados
	espaciosDisp, err := c.getEspaciosDisponiblesCount()
	if err != nil {
		return nil, fmt.Errorf("error obteniendo espacios disponibles: %w", err)
	}

	// Obtener total de espacios
	totalEspacios, err := c.getTotalEspacios()
	if err != nil {
		return nil, fmt.Errorf("error obteniendo total espacios: %w", err)
	}

	// Calcular ocupados
	espaciosOcup := totalEspacios - espaciosDisp

	// Obtener tickets activos (vehículos en el estacionamiento)
	vehiculosActivos, err := c.getVehiculosActivos()
	if err != nil {
		return nil, fmt.Errorf("error obteniendo vehículos activos: %w", err)
	}

	// Obtener dinero recaudado (si tienes endpoint de transacciones)
	dineroHoy, dineroMes := c.getDineroRecaudado()

	return &models.DashboardData{
		EspaciosDisponibles: espaciosDisp,
		EspaciosOcupados:    espaciosOcup,
		TotalEspacios:       totalEspacios,
		DineroRecaudadoHoy:  dineroHoy,
		DineroRecaudadoMes:  dineroMes,
		VehiculosActivos:    vehiculosActivos,
		Timestamp:           time.Now(),
	}, nil
}

// getEspaciosDisponiblesCount obtiene la cantidad de espacios disponibles
func (c *RestClient) getEspaciosDisponiblesCount() (int, error) {
	url := fmt.Sprintf("%s/espacios", c.baseURL)
	
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("status %d", resp.StatusCode)
	}

	var espacios []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&espacios); err != nil {
		return 0, err
	}

	// Contar solo espacios con estado = true (disponibles)
	disponibles := 0
	for _, espacio := range espacios {
		if estado, ok := espacio["estado"].(bool); ok && estado {
			disponibles++
		}
	}

	return disponibles, nil
}

// getTotalEspacios obtiene el total de espacios en el estacionamiento
func (c *RestClient) getTotalEspacios() (int, error) {
	url := fmt.Sprintf("%s/espacios", c.baseURL)
	
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("status %d", resp.StatusCode)
	}

	var espacios []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&espacios); err != nil {
		return 0, err
	}

	return len(espacios), nil
}

// getVehiculosActivos obtiene la cantidad de vehículos actualmente en el estacionamiento
func (c *RestClient) getVehiculosActivos() (int, error) {
	// Usar endpoint de tickets
	url := fmt.Sprintf("%s/tickets", c.baseURL)
	
	resp, err := c.httpClient.Get(url)
	if err != nil {
		// Si falla, retornar 0 en lugar de error
		return 0, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, nil
	}

	var tickets []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&tickets); err != nil {
		return 0, nil
	}

	// Contar solo tickets sin fecha de salida
	activos := 0
	for _, ticket := range tickets {
		if fechaSalida, ok := ticket["fechaSalida"]; !ok || fechaSalida == nil {
			activos++
		}
	}

	return activos, nil
}

// DetallePago representa un registro de pago del backend
type DetallePago struct {
	ID        string  `json:"id"`
	Metodo    string  `json:"metodo"`
	FechaPago string  `json:"fechaPago"`
	PagoTotal float64 `json:"pagoTotal"`
	TicketID  string  `json:"ticketId"`
	PagoID    string  `json:"pagoId"`
}

// getDineroRecaudado obtiene el dinero recaudado (hoy y mes) desde el endpoint detalle-pago
func (c *RestClient) getDineroRecaudado() (float64, float64) {
	url := fmt.Sprintf("%s/detalle-pago", c.baseURL)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		fmt.Printf("Error obteniendo detalles de pago: %v\n", err)
		return 0.0, 0.0
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Status code inesperado al obtener pagos: %d\n", resp.StatusCode)
		return 0.0, 0.0
	}

	var detallesPago []DetallePago
	if err := json.NewDecoder(resp.Body).Decode(&detallesPago); err != nil {
		fmt.Printf("Error decodificando detalles de pago: %v\n", err)
		return 0.0, 0.0
	}

	// Obtener fecha actual
	now := time.Now()
	inicioHoy := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	inicioMes := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	var dineroHoy, dineroMes float64

	for _, detalle := range detallesPago {
		// Parsear la fecha del pago (puede venir en varios formatos)
		fechaPago, err := parseFechaPago(detalle.FechaPago)
		if err != nil {
			fmt.Printf("Error parseando fecha de pago '%s': %v\n", detalle.FechaPago, err)
			continue
		}

		// Sumar al total del mes si la fecha es >= inicio del mes
		if !fechaPago.Before(inicioMes) {
			dineroMes += detalle.PagoTotal

			// Sumar al total de hoy si la fecha es >= inicio del día
			if !fechaPago.Before(inicioHoy) {
				dineroHoy += detalle.PagoTotal
			}
		}
	}

	return dineroHoy, dineroMes
}

// parseFechaPago intenta parsear la fecha en varios formatos comunes
func parseFechaPago(fechaStr string) (time.Time, error) {
	// Formatos comunes que puede devolver el backend
	formatos := []string{
		time.RFC3339,                    // "2006-01-02T15:04:05Z07:00"
		"2006-01-02T15:04:05.000Z",      // ISO con milisegundos
		"2006-01-02T15:04:05Z",          // ISO sin zona horaria
		"2006-01-02T15:04:05",           // Sin zona horaria
		"2006-01-02 15:04:05",           // Formato PostgreSQL
		"2006-01-02",                    // Solo fecha
	}

	for _, formato := range formatos {
		if fecha, err := time.Parse(formato, fechaStr); err == nil {
			return fecha, nil
		}
	}

	return time.Time{}, fmt.Errorf("formato de fecha no reconocido: %s", fechaStr)
}

// GetEspaciosPorSeccion obtiene espacios agrupados por sección desde el REST API
func (c *RestClient) GetEspaciosPorSeccion() ([]models.EspaciosPorSeccion, error) {
	url := fmt.Sprintf("%s/secciones/with-espacios", c.baseURL)
	
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("error al obtener espacios por sección del REST API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("REST API respondió con status %d: %s", resp.StatusCode, string(body))
	}

	var secciones []models.EspaciosPorSeccion
	if err := json.NewDecoder(resp.Body).Decode(&secciones); err != nil {
		return nil, fmt.Errorf("error al decodificar espacios por sección: %w", err)
	}

	return secciones, nil
}

// GetTicketsActivos obtiene tickets activos desde el REST API
func (c *RestClient) GetTicketsActivos() ([]models.Ticket, error) {
	url := fmt.Sprintf("%s/tickets", c.baseURL)
	
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("error al obtener tickets activos del REST API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("REST API respondió con status %d: %s", resp.StatusCode, string(body))
	}

	var tickets []models.Ticket
	if err := json.NewDecoder(resp.Body).Decode(&tickets); err != nil {
		return nil, fmt.Errorf("error al decodificar tickets activos: %w", err)
	}

	return tickets, nil
}

// GetEspaciosDisponibles obtiene espacios disponibles desde el REST API
func (c *RestClient) GetEspaciosDisponibles() ([]models.EspacioDetalle, error) {
	url := fmt.Sprintf("%s/espacios", c.baseURL)
	
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("error al obtener espacios disponibles del REST API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("REST API respondió con status %d: %s", resp.StatusCode, string(body))
	}

	var espacios []models.EspacioDetalle
	if err := json.NewDecoder(resp.Body).Decode(&espacios); err != nil {
		return nil, fmt.Errorf("error al decodificar espacios disponibles: %w", err)
	}

	return espacios, nil
}

// HealthCheck verifica si el REST API está disponible
func (c *RestClient) HealthCheck() error {
	url := fmt.Sprintf("%s/", c.baseURL)
	
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("REST API no disponible: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("REST API respondió con status: %d", resp.StatusCode)
	}

	return nil
}
