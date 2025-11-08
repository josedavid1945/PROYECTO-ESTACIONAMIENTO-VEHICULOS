import strawberry
from uuid import UUID

@strawberry.type
class TipoTarifaType:
    id: UUID
    tipoTarifa: str
    precioHora: float
    precioDia: float