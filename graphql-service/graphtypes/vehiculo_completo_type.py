import strawberry
from uuid import UUID
from typing import Optional

@strawberry.type
class TipoTarifaType:
    id: str
    tipoTarifa: str
    precioHora: float
    precioDia: float

@strawberry.type
class TipoVehiculoCompletoType:
    id: str
    categoria: str
    descripcion: str
    tipotarifa: TipoTarifaType

@strawberry.type
class ClienteType:
    id: str
    nombre: str
    email: str
    telefono: str

@strawberry.type
class VehiculoCompletoType:
    id: UUID
    placa: str
    marca: str
    modelo: str
    cliente: ClienteType
    tipoVehiculo: TipoVehiculoCompletoType
