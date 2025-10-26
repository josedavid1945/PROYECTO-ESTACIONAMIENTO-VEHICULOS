import strawberry
from uuid import UUID
from services.vehiculo_services import get_cliente_by_id, get_tipo_vehiculo_by_id

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