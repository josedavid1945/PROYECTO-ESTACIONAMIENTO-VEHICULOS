import strawberry
from uuid import UUID

@strawberry.type
class DetallePagoType:
    id: UUID
    metodo: str
    fechaPago: str
    pagoTotal: float