import os
from dotenv import load_dotenv
import requests

load_dotenv()

API_URL = os.getenv("API_URL")

def get_todos_espacios():
    response = requests.get(f"{API_URL}/espacios")
    response.raise_for_status()
    return response.json()

def get_todos_secciones():
    response = requests.get(f"{API_URL}/secciones")
    response.raise_for_status()
    return response.json()

def filtrar_secciones_por_letra(letra_seccion: str):
    secciones = get_todos_secciones()
    return [s for s in secciones if s.get("letraSeccion") == letra_seccion]

def filtrar_espacios_por_estado(estado: bool):
    espacios = get_todos_espacios()
    return [e for e in espacios if e.get("estado") == estado]

def filtrar_espacios_por_seccion_y_estado(letra_seccion: str, estado: bool):
    secciones = filtrar_secciones_por_letra(letra_seccion)
    if not secciones:
        return []
    seccion = secciones[0]
    seccion_id = seccion["id"]
    espacios_por_estado = filtrar_espacios_por_estado(estado)
    return [
        e for e in espacios_por_estado
        if e.get("seccionId") == seccion_id 
    ]