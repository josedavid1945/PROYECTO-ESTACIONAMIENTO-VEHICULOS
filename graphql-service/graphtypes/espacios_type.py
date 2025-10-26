import strawberry
from uuid import UUID

@strawberry.type
class EspacioType:
    id: UUID
    numero: str
    _estado: strawberry.Private[bool]

    @strawberry.field
    def estado(self) -> str:
        return "Ocupado" if self._estado else "Disponible"

@strawberry.type
class EstadoEspacioType:
    letraSeccion: str
    espacios: list[EspacioType]
    total: int = 0