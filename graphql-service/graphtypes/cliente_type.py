import strawberry
from uuid import UUID

@strawberry.type
class clienteType:
    id: UUID
    nombre: str
    email: str
    telefono: str