import strawberry
from typing import List
from datetime import datetime
from graphtypes.vehiculos_type import VehiculoType
from services.vehiculo_services import get_all_vehiculos
from services.clientesdiarios_services import filtrar_tickets_por_fecha, get_todos_tickets
from graphtypes.clientesdiarios_type import ClientesDiariosType

@strawberry.type
class Query:
    @strawberry.field
    def vehiculos(self) -> List[VehiculoType]:
        data = get_all_vehiculos()
        fields = {"id", "placa", "marca", "modelo", "clienteId", "tipoVehiculoId"}
        return [VehiculoType(**{k: v[k] for k in fields}) for v in data]
    
    @strawberry.field
    def clientes_por_dia(self, fecha: str) -> List[ClientesDiariosType]:
        vehiculos_map = {v["id"]: v for v in get_all_vehiculos()}
        tickets_filtrados = filtrar_tickets_por_fecha(get_todos_tickets(), fecha, vehiculos_map)
        
        return [
            ClientesDiariosType(
                id=t["id"],
                fechaIngreso=datetime.fromisoformat(t["fechaIngreso"]),
                fechaSalida=datetime.fromisoformat(t["fechaSalida"]) if t.get("fechaSalida") else None,
                vehiculo=VehiculoType(**vehiculos_map[t["vehiculoId"]])
            )
            for t in tickets_filtrados
        ]
schema = strawberry.Schema(Query)
