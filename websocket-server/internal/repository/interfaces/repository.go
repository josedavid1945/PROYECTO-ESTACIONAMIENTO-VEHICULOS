package interfaces

import (
	"context"
	"github.com/josedavid1945/estacionamiento-websocket/internal/domain/models"
)

// DashboardRepository define los métodos para obtener datos del dashboard
type DashboardRepository interface {
	// GetEspaciosStats obtiene estadísticas de espacios
	GetEspaciosStats(ctx context.Context) (disponibles, ocupados, total int, err error)

	// GetDineroRecaudado obtiene el dinero recaudado
	GetDineroRecaudadoHoy(ctx context.Context) (float64, error)
	GetDineroRecaudadoMes(ctx context.Context) (float64, error)

	// GetVehiculosActivos obtiene la cantidad de vehículos actualmente en el estacionamiento
	GetVehiculosActivos(ctx context.Context) (int, error)

	// GetEspaciosPorSeccion obtiene todos los espacios agrupados por sección
	GetEspaciosPorSeccion(ctx context.Context) ([]models.EspaciosPorSeccion, error)

	// GetEspaciosDisponibles obtiene lista de espacios disponibles
	GetEspaciosDisponibles(ctx context.Context) ([]models.Espacio, error)
}

// TicketRepository define los métodos para tickets
type TicketRepository interface {
	// GetTicketsActivos obtiene tickets sin fecha de salida
	GetTicketsActivos(ctx context.Context) ([]models.Ticket, error)

	// GetTicketByID obtiene un ticket por ID
	GetTicketByID(ctx context.Context, id string) (*models.Ticket, error)
}

// VehiculoRepository define los métodos para vehículos
type VehiculoRepository interface {
	// GetVehiculoByID obtiene un vehículo por ID
	GetVehiculoByID(ctx context.Context, id string) (*models.Vehiculo, error)
}
