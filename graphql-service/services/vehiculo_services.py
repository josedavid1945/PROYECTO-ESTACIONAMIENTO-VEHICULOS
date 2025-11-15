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

def get_vehiculos_completos():
    """Obtiene todos los vehículos con su información completa de cliente, tipo de vehículo y tarifa"""
    # Obtener todos los vehículos
    vehiculos = get_all_vehiculos()
    
    vehiculos_completos = []
    for vehiculo in vehiculos:
        try:
            # Obtener información del cliente
            cliente = get_cliente_by_id(vehiculo["clienteId"])
            
            # Obtener información del tipo de vehículo (incluye tarifa)
            tipo_vehiculo = get_tipo_vehiculo_by_id(vehiculo["tipoVehiculoId"])
            
            vehiculo_completo = {
                "id": vehiculo["id"],
                "placa": vehiculo["placa"],
                "marca": vehiculo["marca"],
                "modelo": vehiculo["modelo"],
                "cliente": {
                    "id": cliente["id"],
                    "nombre": cliente["nombre"],
                    "email": cliente["email"],
                    "telefono": cliente["telefono"]
                },
                "tipoVehiculo": tipo_vehiculo
            }
            vehiculos_completos.append(vehiculo_completo)
        except Exception as e:
            print(f"Error procesando vehículo {vehiculo.get('id', 'unknown')}: {e}")
            continue
    
    return vehiculos_completos
