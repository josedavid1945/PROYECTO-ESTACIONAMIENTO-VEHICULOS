import os
from dotenv import load_dotenv
import requests
from uuid import UUID
from datetime import datetime

load_dotenv()

API_URL = os.getenv("API_URL")


def get_todos_tickets():
    response = requests.get(f"{API_URL}/tickets")
    response.raise_for_status()
    return response.json()

def get_vehiculo_by_id(vehiculo_id: UUID):
    response = requests.get(f"{API_URL}/vehiculos/{vehiculo_id}")
    response.raise_for_status()
    return response.json()

def filtrar_tickets_por_fecha(tickets, fecha_str, vehiculos_map):
    """Filtra tickets por fecha y retorna solo los que tienen vehículo válido"""
    fecha_obj = datetime.fromisoformat(fecha_str).date()
    return [
        t for t in tickets
        if datetime.fromisoformat(t["fechaIngreso"]).date() == fecha_obj
        and t["vehiculoId"] in vehiculos_map
    ]