import strawberry
from typing import List
from datetime import datetime
from graphtypes.vehiculos_type import VehiculoType
from services.vehiculo_services import get_all_vehiculos
from services.clientesdiarios_services import filtrar_tickets_por_fecha, get_todos_tickets
from graphtypes.clientesdiarios_type import ClientesDiariosType
from graphtypes.espacios_type import EspacioType, EstadoEspacioType
from services.espacios_services import filtrar_espacios_por_seccion_y_estado

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
        total_tickets = len(tickets_filtrados)
        return [
            ClientesDiariosType(
                id=t["id"],
                fechaIngreso=datetime.fromisoformat(t["fechaIngreso"]),
                fechaSalida=datetime.fromisoformat(t["fechaSalida"]) if t.get("fechaSalida") else None,
                vehiculo=VehiculoType(**vehiculos_map[t["vehiculoId"]]),
                total=total_tickets
            )
            for t in tickets_filtrados
        ]
    
    @strawberry.field
    def estado_de_espacios(self, seccion: str, estado: bool) -> EstadoEspacioType:
        espacios_filtrados = filtrar_espacios_por_seccion_y_estado(seccion, estado)
        
        espacios_lista = [
            EspacioType(
                id=e["id"],
                numero=e["numero"],
                _estado=e["estado"]
            )
            for e in espacios_filtrados
        ]
        
        return EstadoEspacioType(
            letraSeccion=seccion,
            espacios=espacios_lista,
            total=len(espacios_lista)
        )

schema = strawberry.Schema(Query)
