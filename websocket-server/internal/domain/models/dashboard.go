package models

import "time"

// DashboardData contiene todos los datos del dashboard
type DashboardData struct {
	EspaciosDisponibles int       `json:"espacios_disponibles"`
	EspaciosOcupados    int       `json:"espacios_ocupados"`
	TotalEspacios       int       `json:"total_espacios"`
	DineroRecaudadoHoy  float64   `json:"dinero_recaudado_hoy"`
	DineroRecaudadoMes  float64   `json:"dinero_recaudado_mes"`
	VehiculosActivos    int       `json:"vehiculos_activos"`
	Timestamp           time.Time `json:"timestamp"`
}

// EspacioOcupadoEvent evento cuando se ocupa un espacio
type EspacioOcupadoEvent struct {
	EspacioID     string    `json:"espacio_id"`
	Numero        string    `json:"numero"`
	VehiculoPlaca string    `json:"vehiculo_placa"`
	HoraIngreso   time.Time `json:"hora_ingreso"`
}

// EspacioLiberadoEvent evento cuando se libera un espacio
type EspacioLiberadoEvent struct {
	EspacioID   string    `json:"espacio_id"`
	Numero      string    `json:"numero"`
	MontoPagado float64   `json:"monto_pagado"`
	HoraSalida  time.Time `json:"hora_salida"`
}

// EspacioDetalle información detallada de un espacio para el dashboard
type EspacioDetalle struct {
	ID            string  `json:"id"`
	Numero        string  `json:"numero"`
	Estado        bool    `json:"estado"`
	SeccionLetra  string  `json:"seccion_letra"`
	VehiculoPlaca *string `json:"vehiculo_placa,omitempty"`
	HoraIngreso   *string `json:"hora_ingreso,omitempty"`
}

// EspaciosPorSeccion agrupa espacios por sección
type EspaciosPorSeccion struct {
	SeccionLetra        string           `json:"seccion_letra"`
	TotalEspacios       int              `json:"total_espacios"`
	EspaciosDisponibles int              `json:"espacios_disponibles"`
	EspaciosOcupados    int              `json:"espacios_ocupados"`
	Espacios            []EspacioDetalle `json:"espacios"`
}
