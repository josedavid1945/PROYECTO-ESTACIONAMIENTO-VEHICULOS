import strawberry
from uuid import UUID
from datetime import datetime
from graphtypes.vehiculos_type import VehiculoType
from graphtypes.espacios_type import EspacioType
from graphtypes.detallepago_type import DetallePagoType

@strawberry.type
class TicketType:
    id: UUID
    fechaIngreso: datetime
    fechaSalida: datetime | None
    vehiculo: VehiculoType
    espacio: EspacioType
    detallePago: DetallePagoType | None

