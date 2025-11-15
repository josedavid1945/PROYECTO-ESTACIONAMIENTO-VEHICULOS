from services.vehiculo_services import get_vehiculos_completos
import json

print("Probando get_vehiculos_completos()...")
try:
    result = get_vehiculos_completos()
    print(f"\n✅ Éxito! Se obtuvieron {len(result)} vehículos")
    print(f"\nPrimer vehículo:")
    if result:
        print(json.dumps(result[0], indent=2, default=str))
    else:
        print("Array vacío")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
