import strawberry
from uuid import UUID
from typing import List

@strawberry.type
class EspacioType:
    """Tipo GraphQL para representar un Espacio de estacionamiento"""
    id: UUID
    numero: str
    _estado: strawberry.Private[bool]

    @strawberry.field
    def estado(self) -> str:
        """Estado del espacio: True = Disponible, False = Ocupado"""
        return "Disponible" if self._estado else "Ocupado"

@strawberry.type
class EstadoEspacioType:
    letraSeccion: str
    espacios: list[EspacioType]
    total: int = 0