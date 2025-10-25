import strawberry
from typing import List, Optional
from uuid import UUID
from graphtypes.vehiculos_type import VehiculoType
from services.vehiculo_services import get_all_vehiculos

@strawberry.type
class Query:
    @strawberry.field
    def vehiculos(self) -> List[VehiculoType]:
        data = get_all_vehiculos()
        fields = {"id", "placa", "marca"}
        return [VehiculoType(**{k: v[k] for k in fields}) for v in data]

schema = strawberry.Schema(Query)
