import strawberry
from uuid import UUID
from typing import Optional

@strawberry.type
class ClienteType:
    """Tipo GraphQL para representar un Cliente"""
    id: UUID
    nombre: str
    email: str
    telefono: str