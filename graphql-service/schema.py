import strawberry
from typing import List
from datetime import datetime
from graphtypes.vehiculos_type import VehiculoType, TipoVehiculoType, VehiculocompletoType
from services.vehiculo_services import get_all_vehiculos, get_all_tipo_vehiculos
from services.clientesdiarios_services import filtrar_tickets_por_fecha, get_todos_tickets
from graphtypes.clientesdiarios_type import ClientesDiariosType
from services.detallepago_services import get_todos_detallepago
from graphtypes.ticket_type import TicketType
from graphtypes.detallepago_type import DetallePagoType
from graphtypes.espacios_type import EspacioType, EstadoEspacioType
from graphtypes.cliente_type import ClienteType
from graphtypes.tipoTarifa_type import TipoTarifaType
from services.espacios_services import filtrar_espacios_por_seccion_y_estado, get_todos_espacios
from services.cliente_services import get_all_clientes
from services.tipoTarifa_services import get_all_tipo_tarifas

@strawberry.type
class Query:
    @strawberry.field
    def vehiculos(self) -> List[VehiculoType]:
        data = get_all_vehiculos()
        fields = {"id", "placa", "marca", "modelo", "clienteId", "tipoVehiculoId"}
        return [VehiculoType(**{k: v[k] for k in fields}) for v in data]
    
    @strawberry.field
    def detalle_pagos(self) -> List[DetallePagoType]:
        data = get_todos_detallepago()
        fields = {"id", "pagoTotal", "fechaPago", "metodo"}
        return [DetallePagoType(**{k: v[k] for k in fields}) for v in data]

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

    @strawberry.field
    def tickets(self) -> List[TicketType]:
        tickets = get_todos_tickets()
        vehiculos_map = {v["id"]: v for v in get_all_vehiculos()}
        espacios_map = {e["id"]: e for e in get_todos_espacios()}
        pagos_map = {p["id"]: p for p in get_todos_detallepago()}
        
        result = []
        for t in tickets:
            # Verificar que el vehículo existe
            if t["vehiculoId"] not in vehiculos_map:
                print(f"⚠️ Ticket {t['id']} tiene vehiculoId {t['vehiculoId']} que no existe")
                continue
            
            # Verificar que el espacio existe
            if t["espacioId"] not in espacios_map:
                print(f"⚠️ Ticket {t['id']} tiene espacioId {t['espacioId']} que no existe")
                continue
            
            try:
                ticket = TicketType(
                    id=t["id"],
                    fechaIngreso=datetime.fromisoformat(t["fechaIngreso"].replace('Z', '+00:00')),
                    fechaSalida=datetime.fromisoformat(t["fechaSalida"].replace('Z', '+00:00')) if t.get("fechaSalida") else None,
                    vehiculo=VehiculoType(**vehiculos_map[t["vehiculoId"]]),
                    espacio=EspacioType(
                        id=espacios_map[t["espacioId"]]["id"],
                        numero=espacios_map[t["espacioId"]]["numero"],
                        _estado=espacios_map[t["espacioId"]]["estado"]
                    ),
                    detallePago=DetallePagoType(
                        id=pagos_map[t["detallePagoId"]]["id"],
                        metodo=pagos_map[t["detallePagoId"]]["metodo"],
                        fechaPago=pagos_map[t["detallePagoId"]]["fechaPago"],
                        pagoTotal=pagos_map[t["detallePagoId"]]["pagoTotal"]
                    ) if t.get("detallePagoId") and t["detallePagoId"] in pagos_map else None
                )
                result.append(ticket)
            except Exception as e:
                print(f"❌ Error procesando ticket {t['id']}: {str(e)}")
                continue
        
        print(f"✅ Tickets procesados: {len(result)} de {len(tickets)}")
        return result
    
    @strawberry.field
    def vehiculos_completos(self) -> List[VehiculocompletoType]:
        vehiculos = get_all_vehiculos()
        clientes_map = {c["id"]: c for c in get_all_clientes()}
        tipos_map = {t["id"]: t for t in get_all_tipo_vehiculos()}
        tipos_tarifa_map = {t["id"]: t for t in get_all_tipo_tarifas()}

        return [
            VehiculocompletoType(
                id=v["id"],
                placa=v["placa"],
                marca=v["marca"],
                modelo=v["modelo"],
                cliente=ClienteType(**clientes_map[v["clienteId"]]),
                tipoVehiculo=TipoVehiculoType(
                    id=tipos_map[v["tipoVehiculoId"]]["id"],
                    categoria=tipos_map[v["tipoVehiculoId"]]["categoria"],
                    descripcion=tipos_map[v["tipoVehiculoId"]]["descripcion"],
                    tipotarifa=TipoTarifaType(**tipos_tarifa_map[tipos_map[v["tipoVehiculoId"]]["tipoTarifaId"]])
                )
            )
            for v in vehiculos
        ]

schema = strawberry.Schema(Query)
