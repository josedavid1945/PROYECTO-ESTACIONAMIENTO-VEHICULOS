export interface Restticketresponse {
  id:           string;
  fechaIngreso: Date;
  fechaSalida:  Date;
  vehiculo:     Vehiculo;
  espacio:      Espacio;
  detallePago:  null;
}

export interface Espacio {
  id:     string;
  numero: string;
  estado: string;
}

export interface Vehiculo {
  id:             string;
  placa:          string;
  marca:          string;
  modelo:         string;
  clienteId:      string;
  tipoVehiculoId: string;
  clienteNombre:  string;
  tipoVehiculo:   string;
}
