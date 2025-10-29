import os
from dotenv import load_dotenv
import requests

load_dotenv()

API_URL = os.getenv("API_URL")

def get_todos_detallepago():
    response = requests.get(f"{API_URL}/detalle-pago")
    response.raise_for_status()
    return response.json()