package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/josedavid1945/estacionamiento-websocket/internal/domain/models"
)

// DashboardRepository implementación PostgreSQL del repositorio de dashboard
type DashboardRepository struct {
	db *sql.DB
}

// NewDashboardRepository crea una nueva instancia del repositorio
func NewDashboardRepository(db *sql.DB) *DashboardRepository {
	return &DashboardRepository{db: db}
}

// GetEspaciosStats obtiene estadísticas de espacios
func (r *DashboardRepository) GetEspaciosStats(ctx context.Context) (disponibles, ocupados, total int, err error) {
	query := `
		SELECT 
			COUNT(*) FILTER (WHERE estado = true) as disponibles,
			COUNT(*) FILTER (WHERE estado = false) as ocupados,
			COUNT(*) as total
		FROM espacio
	`

	err = r.db.QueryRowContext(ctx, query).Scan(&disponibles, &ocupados, &total)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("error al obtener estadísticas de espacios: %w", err)
	}

	return disponibles, ocupados, total, nil
}

// GetDineroRecaudadoHoy obtiene el dinero recaudado hoy
func (r *DashboardRepository) GetDineroRecaudadoHoy(ctx context.Context) (float64, error) {
	query := `
		SELECT COALESCE(SUM(dp.pago_total), 0) as total
		FROM detalle_pago dp
		WHERE DATE(dp.fecha_pago) = CURRENT_DATE
	`

	var total float64
	err := r.db.QueryRowContext(ctx, query).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("error al obtener dinero recaudado hoy: %w", err)
	}

	return total, nil
}

// GetDineroRecaudadoMes obtiene el dinero recaudado en el mes actual
func (r *DashboardRepository) GetDineroRecaudadoMes(ctx context.Context) (float64, error) {
	query := `
		SELECT COALESCE(SUM(dp.pago_total), 0) as total
		FROM detalle_pago dp
		WHERE DATE_TRUNC('month', dp.fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)
	`

	var total float64
	err := r.db.QueryRowContext(ctx, query).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("error al obtener dinero recaudado del mes: %w", err)
	}

	return total, nil
}

// GetVehiculosActivos obtiene la cantidad de vehículos actualmente en el estacionamiento
func (r *DashboardRepository) GetVehiculosActivos(ctx context.Context) (int, error) {
	query := `
		SELECT COUNT(*) 
		FROM ticket 
		WHERE "fechaSalida" IS NULL
	`

	var count int
	err := r.db.QueryRowContext(ctx, query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error al obtener vehículos activos: %w", err)
	}

	return count, nil
}

// GetEspaciosPorSeccion obtiene todos los espacios agrupados por sección con detalles
func (r *DashboardRepository) GetEspaciosPorSeccion(ctx context.Context) ([]models.EspaciosPorSeccion, error) {
	// Primero obtenemos las secciones
	seccionesQuery := `
		SELECT DISTINCT s.id, s.letra_seccion
		FROM seccion s
		ORDER BY s.letra_seccion
	`

	rows, err := r.db.QueryContext(ctx, seccionesQuery)
	if err != nil {
		return nil, fmt.Errorf("error al obtener secciones: %w", err)
	}
	defer rows.Close()

	var secciones []models.EspaciosPorSeccion

	for rows.Next() {
		var seccionID, letraSeccion string
		if err := rows.Scan(&seccionID, &letraSeccion); err != nil {
			return nil, fmt.Errorf("error al escanear sección: %w", err)
		}

		// Obtener espacios de esta sección con información del vehículo si está ocupado
		espaciosQuery := `
			SELECT 
				e.id,
				e.numero,
				e.estado,
				v.placa,
				t."fechaIngreso"
			FROM espacio e
			LEFT JOIN ticket t ON t."espacioId" = e.id AND t."fechaSalida" IS NULL
			LEFT JOIN vehiculo v ON v.id = t."vehiculoId"
			WHERE e."seccionId" = $1
			ORDER BY e.numero
		`

		espaciosRows, err := r.db.QueryContext(ctx, espaciosQuery, seccionID)
		if err != nil {
			return nil, fmt.Errorf("error al obtener espacios de sección %s: %w", letraSeccion, err)
		}

		var espacios []models.EspacioDetalle
		disponibles := 0
		ocupados := 0

		for espaciosRows.Next() {
			var espacio models.EspacioDetalle
			var placa sql.NullString
			var fechaIngreso sql.NullTime

			if err := espaciosRows.Scan(
				&espacio.ID,
				&espacio.Numero,
				&espacio.Estado,
				&placa,
				&fechaIngreso,
			); err != nil {
				espaciosRows.Close()
				return nil, fmt.Errorf("error al escanear espacio: %w", err)
			}

			espacio.SeccionLetra = letraSeccion

			if placa.Valid {
				espacio.VehiculoPlaca = &placa.String
			}

			if fechaIngreso.Valid {
				horaStr := fechaIngreso.Time.Format(time.RFC3339)
				espacio.HoraIngreso = &horaStr
			}

			if espacio.Estado {
				disponibles++
			} else {
				ocupados++
			}

			espacios = append(espacios, espacio)
		}
		espaciosRows.Close()

		if err := espaciosRows.Err(); err != nil {
			return nil, fmt.Errorf("error iterando espacios: %w", err)
		}

		seccion := models.EspaciosPorSeccion{
			SeccionLetra:        letraSeccion,
			TotalEspacios:       len(espacios),
			EspaciosDisponibles: disponibles,
			EspaciosOcupados:    ocupados,
			Espacios:            espacios,
		}

		secciones = append(secciones, seccion)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterando secciones: %w", err)
	}

	return secciones, nil
}

// GetEspaciosDisponibles obtiene lista de espacios disponibles
func (r *DashboardRepository) GetEspaciosDisponibles(ctx context.Context) ([]models.Espacio, error) {
	query := `
		SELECT id, numero, estado, "seccionId"
		FROM espacio
		WHERE estado = true
		ORDER BY numero
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error al obtener espacios disponibles: %w", err)
	}
	defer rows.Close()

	var espacios []models.Espacio
	for rows.Next() {
		var espacio models.Espacio
		if err := rows.Scan(&espacio.ID, &espacio.Numero, &espacio.Estado, &espacio.SeccionID); err != nil {
			return nil, fmt.Errorf("error al escanear espacio: %w", err)
		}
		espacios = append(espacios, espacio)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterando espacios: %w", err)
	}

	return espacios, nil
}
