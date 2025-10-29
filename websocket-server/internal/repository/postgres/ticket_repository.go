package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/josedavid1945/estacionamiento-websocket/internal/domain/models"
)

// TicketRepository implementación PostgreSQL del repositorio de tickets
type TicketRepository struct {
	db *sql.DB
}

// NewTicketRepository crea una nueva instancia del repositorio
func NewTicketRepository(db *sql.DB) *TicketRepository {
	return &TicketRepository{db: db}
}

// GetTicketsActivos obtiene tickets sin fecha de salida
func (r *TicketRepository) GetTicketsActivos(ctx context.Context) ([]models.Ticket, error) {
	query := `
		SELECT id, "fechaIngreso", "fechaSalida", "vehiculoId", "espacioId", "detallePagoId"
		FROM ticket
		WHERE "fechaSalida" IS NULL
		ORDER BY "fechaIngreso" DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error al obtener tickets activos: %w", err)
	}
	defer rows.Close()

	var tickets []models.Ticket
	for rows.Next() {
		var ticket models.Ticket
		var fechaSalida sql.NullTime
		var detallePagoID sql.NullString

		if err := rows.Scan(
			&ticket.ID,
			&ticket.FechaIngreso,
			&fechaSalida,
			&ticket.VehiculoID,
			&ticket.EspacioID,
			&detallePagoID,
		); err != nil {
			return nil, fmt.Errorf("error al escanear ticket: %w", err)
		}

		if fechaSalida.Valid {
			ticket.FechaSalida = &fechaSalida.Time
		}

		if detallePagoID.Valid {
			ticket.DetallePagoID = &detallePagoID.String
		}

		tickets = append(tickets, ticket)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterando tickets: %w", err)
	}

	return tickets, nil
}

// GetTicketByID obtiene un ticket por ID
func (r *TicketRepository) GetTicketByID(ctx context.Context, id string) (*models.Ticket, error) {
	query := `
		SELECT id, "fechaIngreso", "fechaSalida", "vehiculoId", "espacioId", "detallePagoId"
		FROM ticket
		WHERE id = $1
	`

	var ticket models.Ticket
	var fechaSalida sql.NullTime
	var detallePagoID sql.NullString

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&ticket.ID,
		&ticket.FechaIngreso,
		&fechaSalida,
		&ticket.VehiculoID,
		&ticket.EspacioID,
		&detallePagoID,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("error al obtener ticket: %w", err)
	}

	if fechaSalida.Valid {
		ticket.FechaSalida = &fechaSalida.Time
	}

	if detallePagoID.Valid {
		ticket.DetallePagoID = &detallePagoID.String
	}

	return &ticket, nil
}
