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