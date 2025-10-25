import strawberry
from uuid import UUID

@strawberry.type
class VehiculoType:
    id: UUID
    placa: str
    marca: str