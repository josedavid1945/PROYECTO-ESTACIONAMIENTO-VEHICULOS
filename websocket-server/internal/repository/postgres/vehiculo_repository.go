package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/josedavid1945/estacionamiento-websocket/internal/domain/models"
)

// VehiculoRepository implementación PostgreSQL del repositorio de vehículos
type VehiculoRepository struct {
	db *sql.DB
}

// NewVehiculoRepository crea una nueva instancia del repositorio
func NewVehiculoRepository(db *sql.DB) *VehiculoRepository {
	return &VehiculoRepository{db: db}
}

// GetVehiculoByID obtiene un vehículo por ID
func (r *VehiculoRepository) GetVehiculoByID(ctx context.Context, id string) (*models.Vehiculo, error) {
	query := `
		SELECT id, placa, marca, modelo, "clienteId", "tipoVehiculoId"
		FROM vehiculo
		WHERE id = $1
	`

	var vehiculo models.Vehiculo
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&vehiculo.ID,
		&vehiculo.Placa,
		&vehiculo.Marca,
		&vehiculo.Modelo,
		&vehiculo.ClienteID,
		&vehiculo.TipoVehiculoID,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("error al obtener vehículo: %w", err)
	}

	return &vehiculo, nil
}
