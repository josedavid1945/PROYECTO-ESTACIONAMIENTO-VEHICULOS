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

// GetDashboardData obtiene los datos del dashboard desde el REST API
func (c *RestClient) GetDashboardData() (*models.DashboardData, error) {
	url := fmt.Sprintf("%s/api/dashboard", c.baseURL)
	
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("error al obtener dashboard del REST API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("REST API respondió con status %d: %s", resp.StatusCode, string(body))
	}

	var data models.DashboardData
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("error al decodificar respuesta del dashboard: %w", err)
	}

	return &data, nil
}

// GetEspaciosPorSeccion obtiene espacios agrupados por sección desde el REST API
func (c *RestClient) GetEspaciosPorSeccion() ([]models.EspaciosPorSeccion, error) {
	url := fmt.Sprintf("%s/api/espacios/por-seccion", c.baseURL)
	
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
	url := fmt.Sprintf("%s/api/tickets/activos", c.baseURL)
	
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
	url := fmt.Sprintf("%s/api/espacios/disponibles", c.baseURL)
	
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
	url := fmt.Sprintf("%s/api/health", c.baseURL)
	
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
