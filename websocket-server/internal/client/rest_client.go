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

// getDineroRecaudado obtiene el dinero recaudado (hoy y mes)
func (c *RestClient) getDineroRecaudado() (float64, float64) {
	// TODO: Si tienes endpoint de transacciones/pagos, usar aquí
	// Por ahora retornar 0
	return 0.0, 0.0
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
