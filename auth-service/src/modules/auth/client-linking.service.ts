import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LinkingResult {
  linked: boolean;
  clienteId?: string;
  clienteNombre?: string;
  vehiculos?: Array<{
    id: string;
    placa: string;
    marca: string;
    modelo: string;
  }>;
  message: string;
}

/**
 * ClientLinkingService - Vincula usuarios del Auth Service con clientes del Backend REST
 * 
 * Cuando un usuario se registra, este servicio busca si ya existe un cliente
 * en el sistema de estacionamiento (registrado previamente por un admin) y
 * los vincula automáticamente.
 */
@Injectable()
export class ClientLinkingService {
  private readonly logger = new Logger(ClientLinkingService.name);
  private readonly backendUrl: string;

  constructor(private configService: ConfigService) {
    this.backendUrl = this.configService.get<string>('BACKEND_REST_URL', 'http://localhost:3000');
  }

  /**
   * Intenta vincular un usuario recién registrado con un cliente existente
   * Busca primero por email, luego por placa de vehículo
   */
  async tryLinkUserToClient(
    userId: string,
    email: string,
    vehiclePlate?: string,
  ): Promise<LinkingResult> {
    this.logger.log(`Intentando vincular usuario ${userId} con cliente existente...`);

    try {
      // 1. Primero buscar por email
      const clientByEmail = await this.findClientByEmail(email);
      if (clientByEmail) {
        this.logger.log(`Cliente encontrado por email: ${clientByEmail.id}`);
        const linkResult = await this.linkClientToUser(clientByEmail.id, userId);
        if (linkResult) {
          return {
            linked: true,
            clienteId: clientByEmail.id,
            clienteNombre: clientByEmail.nombre,
            vehiculos: clientByEmail.vehiculos,
            message: `¡Bienvenido de nuevo! Tu cuenta ha sido vinculada con tu perfil de cliente existente.`,
          };
        }
      }

      // 2. Si no se encontró por email y hay placa, buscar por placa
      if (vehiclePlate) {
        const clientByPlate = await this.findClientByVehiclePlate(vehiclePlate);
        if (clientByPlate) {
          this.logger.log(`Cliente encontrado por placa ${vehiclePlate}: ${clientByPlate.id}`);
          
          // Actualizar email del cliente si es diferente
          await this.updateClientEmail(clientByPlate.id, email);
          
          const linkResult = await this.linkClientToUser(clientByPlate.id, userId);
          if (linkResult) {
            return {
              linked: true,
              clienteId: clientByPlate.id,
              clienteNombre: clientByPlate.nombre,
              vehiculos: clientByPlate.vehiculos,
              message: `¡Tu cuenta ha sido vinculada! Encontramos tu vehículo con placa ${vehiclePlate} en nuestro sistema.`,
            };
          }
        }
      }

      // No se encontró cliente existente
      this.logger.log(`No se encontró cliente existente para vincular`);
      return {
        linked: false,
        message: 'Cuenta creada exitosamente. Podrás vincular tus vehículos desde el portal de usuario.',
      };

    } catch (error) {
      this.logger.error(`Error al intentar vincular usuario: ${error.message}`);
      return {
        linked: false,
        message: 'Cuenta creada exitosamente. La vinculación automática no está disponible temporalmente.',
      };
    }
  }

  /**
   * Busca un cliente por email en el backend REST
   */
  private async findClientByEmail(email: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.backendUrl}/registro/buscar-cliente/${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Error buscando cliente por email: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca un cliente por placa de vehículo
   */
  private async findClientByVehiclePlate(plate: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.backendUrl}/registro/buscar-vehiculo/${encodeURIComponent(plate)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const vehiculo = await response.json();
        // El vehículo tiene clienteId, necesitamos obtener el cliente
        if (vehiculo && vehiculo.clienteId) {
          const clienteResponse = await fetch(
            `${this.backendUrl}/clientes/${vehiculo.clienteId}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          );
          if (clienteResponse.ok) {
            return await clienteResponse.json();
          }
        }
      }
      return null;
    } catch (error) {
      this.logger.warn(`Error buscando cliente por placa: ${error.message}`);
      return null;
    }
  }

  /**
   * Vincula un cliente con un usuario del Auth Service
   */
  private async linkClientToUser(clienteId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.backendUrl}/user-portal/vincular`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authUserId: userId,
            clienteId: clienteId,
          }),
        }
      );

      if (response.ok) {
        this.logger.log(`Cliente ${clienteId} vinculado exitosamente con usuario ${userId}`);
        return true;
      }

      const errorText = await response.text();
      this.logger.warn(`Error vinculando cliente: ${errorText}`);
      return false;
    } catch (error) {
      this.logger.error(`Error en linkClientToUser: ${error.message}`);
      return false;
    }
  }

  /**
   * Actualiza el email de un cliente existente
   */
  private async updateClientEmail(clienteId: string, email: string): Promise<void> {
    try {
      await fetch(
        `${this.backendUrl}/clientes/${clienteId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
    } catch (error) {
      this.logger.warn(`No se pudo actualizar email del cliente: ${error.message}`);
    }
  }
}
