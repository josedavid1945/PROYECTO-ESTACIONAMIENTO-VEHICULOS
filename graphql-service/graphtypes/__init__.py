"""
GraphQL Types Module

Este módulo exporta todos los tipos GraphQL utilizados en el schema.
"""

from .cliente_type import ClienteType
from .vehiculos_type import VehiculoType, TipoVehiculoType, VehiculocompletoType
from .espacios_type import EspacioType, EstadoEspacioType
from .ticket_type import TicketType
from .detallepago_type import DetallePagoType
from .clientesdiarios_type import ClientesDiariosType
from .tipoTarifa_type import TipoTarifaType
from .vehiculo_completo_type import VehiculoCompletoType, TipoVehiculoCompletoType, TipoTarifaType as TipoTarifaCompletoType

__all__ = [
    'ClienteType',
    'VehiculoType',
    'TipoVehiculoType',
    'VehiculocompletoType',
    'VehiculoCompletoType',
    'TipoVehiculoCompletoType',
    'EspacioType',
    'EstadoEspacioType',
    'TicketType',
    'DetallePagoType',
    'ClientesDiariosType',
    'TipoTarifaType',
]
