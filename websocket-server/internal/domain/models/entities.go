package models

import "time"

// Espacio representa un espacio de estacionamiento
type Espacio struct {
	ID        string `json:"id"`
	Numero    string `json:"numero"`
	Estado    bool   `json:"estado"` // true = disponible, false = ocupado
	SeccionID string `json:"seccion_id"`
}

// Ticket representa un ticket de ingreso/salida
type Ticket struct {
	ID            string     `json:"id"`
	FechaIngreso  time.Time  `json:"fecha_ingreso"`
	FechaSalida   *time.Time `json:"fecha_salida,omitempty"`
	VehiculoID    string     `json:"vehiculo_id"`
	EspacioID     string     `json:"espacio_id"`
	DetallePagoID *string    `json:"detalle_pago_id,omitempty"`
}

// Pago representa un pago realizado
type Pago struct {
	ID           string  `json:"id"`
	Monto        float64 `json:"monto"`
	TipoTarifaID string  `json:"tipo_tarifa_id"`
}

// DetallePago representa los detalles de un pago
type DetallePago struct {
	ID         string    `json:"id"`
	Metodo     string    `json:"metodo"`
	FechaPago  time.Time `json:"fecha_pago"`
	PagoTotal  float64   `json:"pago_total"`
	TicketID   string    `json:"ticket_id"`
	PagoID     string    `json:"pago_id"`
}

// Vehiculo representa un vehículo
type Vehiculo struct {
	ID              string `json:"id"`
	Placa           string `json:"placa"`
	Marca           string `json:"marca"`
	Modelo          string `json:"modelo"`
	ClienteID       string `json:"cliente_id"`
	TipoVehiculoID  string `json:"tipo_vehiculo_id"`
}

// Seccion representa una sección del estacionamiento
type Seccion struct {
	ID           string `json:"id"`
	LetraSeccion string `json:"letra_seccion"`
}
