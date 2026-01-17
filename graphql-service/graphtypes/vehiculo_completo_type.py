import strawberry
from uuid import UUID
from typing import Optional
from graphtypes.cliente_type import ClienteType

@strawberry.type
class TipoTarifaType:
    """Tipo GraphQL para representar la información de tarifa"""
    id: str
    tipoTarifa: str
    precioHora: float
    precioDia: float

@strawberry.type
class TipoVehiculoCompletoType:
    """Tipo GraphQL para representar el tipo de vehículo con su tarifa"""
    id: str
    categoria: str
    descripcion: str
    tipotarifa: TipoTarifaType

@strawberry.type
class VehiculoCompletoType:
    """Tipo GraphQL para representar un vehículo con toda su información relacionada"""
    id: UUID
    placa: str
    marca: str
    modelo: str
    cliente: ClienteType
    tipoVehiculo: TipoVehiculoCompletoType
