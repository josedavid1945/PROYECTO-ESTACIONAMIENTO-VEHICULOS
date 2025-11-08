import strawberry
from uuid import UUID
from services.vehiculo_services import get_cliente_by_id, get_tipo_vehiculo_by_id
from graphtypes.tipoTarifa_type import TipoTarifaType
from graphtypes.cliente_type import clienteType

@strawberry.type
class VehiculoType:
    id: UUID
    placa: str
    marca: str
    modelo: str
    clienteId: str
    tipoVehiculoId: str 

    @strawberry.field
    def clienteNombre(self) -> str:
        cliente = get_cliente_by_id(self.clienteId)
        return cliente.get("nombre", "Desconocido")
    
    @strawberry.field
    def tipoVehiculo(self) -> str:
        tipo = get_tipo_vehiculo_by_id(self.tipoVehiculoId)
        return tipo.get("categoria", "Desconocido")

@strawberry.type
class TipoVehiculoType:
    id: UUID
    categoria: str
    descripcion: str
    tipotarifa: TipoTarifaType


@strawberry.type
class VehiculocompletoType:
    id: UUID
    placa: str
    marca: str
    modelo: str
    cliente: clienteType
    tipoVehiculo: TipoVehiculoType