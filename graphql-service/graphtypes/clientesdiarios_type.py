import strawberry
from graphtypes.vehiculos_type import VehiculoType
from datetime import datetime
from uuid import UUID

@strawberry.type
class ClientesDiariosType:
    id: UUID
    fechaIngreso: datetime
    fechaSalida: datetime | None
    vehiculo: VehiculoType
    total: int = 0