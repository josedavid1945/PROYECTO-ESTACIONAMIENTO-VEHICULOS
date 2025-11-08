import os
from dotenv import load_dotenv
import requests
from uuid import UUID

load_dotenv()

API_URL = os.getenv("API_URL")

def get_all_vehiculos():
    response = requests.get(f"{API_URL}/vehiculos")
    response.raise_for_status()
    return response.json()

def get_all_tipo_vehiculos():
    response = requests.get(f"{API_URL}/tipo-vehiculo")
    response.raise_for_status()
    return response.json()

def get_cliente_by_id(cliente_id: str):
    response = requests.get(f"{API_URL}/clientes/{cliente_id}")
    response.raise_for_status()
    return response.json()

def get_tipo_vehiculo_by_id(tipo_vehiculo_id: str):
    response = requests.get(f"{API_URL}/tipo-vehiculo/{tipo_vehiculo_id}")
    response.raise_for_status()
    return response.json()
