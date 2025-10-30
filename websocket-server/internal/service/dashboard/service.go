package dashboard

import (
	"context"
	"log"
	"time"

	"github.com/josedavid1945/estacionamiento-websocket/internal/client"
	"github.com/josedavid1945/estacionamiento-websocket/internal/domain/models"
	"github.com/josedavid1945/estacionamiento-websocket/internal/repository/interfaces"
)

// Service contiene la lógica de negocio del dashboard
type Service struct {
	dashboardRepo interfaces.DashboardRepository
	ticketRepo    interfaces.TicketRepository
	vehiculoRepo  interfaces.VehiculoRepository
	restClient    *client.RestClient
	useRestAPI    bool
}

// NewService crea una nueva instancia del servicio
func NewService(
	dashboardRepo interfaces.DashboardRepository,
	ticketRepo interfaces.TicketRepository,
	vehiculoRepo interfaces.VehiculoRepository,
) *Service {
	return &Service{
		dashboardRepo: dashboardRepo,
		ticketRepo:    ticketRepo,
		vehiculoRepo:  vehiculoRepo,
		restClient:    nil,
		useRestAPI:    false,
	}
}

// NewServiceWithRestAPI crea una instancia del servicio usando REST API
func NewServiceWithRestAPI(restAPIURL string) *Service {
	return &Service{
		dashboardRepo: nil,
		ticketRepo:    nil,
		vehiculoRepo:  nil,
		restClient:    client.NewRestClient(restAPIURL),
		useRestAPI:    true,
	}
}

// GetDashboardData obtiene todos los datos del dashboard
func (s *Service) GetDashboardData(ctx context.Context) (*models.DashboardData, error) {
	// Si está configurado para usar REST API
	if s.useRestAPI && s.restClient != nil {
		return s.restClient.GetDashboardData()
	}

	// Modo database: consultar repositorios directamente
	// Obtener estadísticas de espacios
	disponibles, ocupados, total, err := s.dashboardRepo.GetEspaciosStats(ctx)
	if err != nil {
		log.Printf("Error obteniendo estadísticas de espacios: %v", err)
		return nil, err
	}

	// Obtener dinero recaudado hoy
	dineroHoy, err := s.dashboardRepo.GetDineroRecaudadoHoy(ctx)
	if err != nil {
		log.Printf("Error obteniendo dinero recaudado hoy: %v", err)
		return nil, err
	}

	// Obtener dinero recaudado en el mes
	dineroMes, err := s.dashboardRepo.GetDineroRecaudadoMes(ctx)
	if err != nil {
		log.Printf("Error obteniendo dinero recaudado del mes: %v", err)
		return nil, err
	}

	// Obtener vehículos activos
	vehiculosActivos, err := s.dashboardRepo.GetVehiculosActivos(ctx)
	if err != nil {
		log.Printf("Error obteniendo vehículos activos: %v", err)
		return nil, err
	}

	return &models.DashboardData{
		EspaciosDisponibles: disponibles,
		EspaciosOcupados:    ocupados,
		TotalEspacios:       total,
		DineroRecaudadoHoy:  dineroHoy,
		DineroRecaudadoMes:  dineroMes,
		VehiculosActivos:    vehiculosActivos,
		Timestamp:           time.Now(),
	}, nil
}

// GetEspaciosPorSeccion obtiene espacios agrupados por sección
func (s *Service) GetEspaciosPorSeccion(ctx context.Context) ([]models.EspaciosPorSeccion, error) {
	// Si está configurado para usar REST API
	if s.useRestAPI && s.restClient != nil {
		return s.restClient.GetEspaciosPorSeccion()
	}

	secciones, err := s.dashboardRepo.GetEspaciosPorSeccion(ctx)
	if err != nil {
		log.Printf("Error obteniendo espacios por sección: %v", err)
		return nil, err
	}

	return secciones, nil
}

// GetEspaciosDisponibles obtiene lista de espacios disponibles
func (s *Service) GetEspaciosDisponibles(ctx context.Context) ([]models.EspacioDetalle, error) {
	// Si está configurado para usar REST API
	if s.useRestAPI && s.restClient != nil {
		return s.restClient.GetEspaciosDisponibles()
	}

	espacios, err := s.dashboardRepo.GetEspaciosDisponibles(ctx)
	if err != nil {
		log.Printf("Error obteniendo espacios disponibles: %v", err)
		return nil, err
	}

	// Convertir []Espacio a []EspacioDetalle
	result := make([]models.EspacioDetalle, len(espacios))
	for i, e := range espacios {
		result[i] = models.EspacioDetalle{
			ID:           e.ID,
			Numero:       e.Numero,
			Estado:       e.Estado,
			SeccionLetra: "", // Se obtendría de una relación si fuera necesario
		}
	}

	return result, nil
}

// GetTicketsActivos obtiene tickets activos con información del vehículo
func (s *Service) GetTicketsActivos(ctx context.Context) ([]models.Ticket, error) {
	// Si está configurado para usar REST API
	if s.useRestAPI && s.restClient != nil {
		return s.restClient.GetTicketsActivos()
	}

	tickets, err := s.ticketRepo.GetTicketsActivos(ctx)
	if err != nil {
		log.Printf("Error obteniendo tickets activos: %v", err)
		return nil, err
	}

	return tickets, nil
}
