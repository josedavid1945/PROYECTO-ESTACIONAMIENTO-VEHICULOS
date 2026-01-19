import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpToolsService } from './mcp-tools.service';

/**
 * ParkingToolsService - Herramientas MCP específicas para gestión de estacionamiento
 * 
 * Implementa herramientas de:
 * - Consulta: Buscar clientes, ver tickets históricos
 * - Acción: Registrar ingreso/salida de vehículos
 * - Reporte: Resumen operativo diario
 */
@Injectable()
export class ParkingToolsService implements OnModuleInit {
  private readonly logger = new Logger(ParkingToolsService.name);
  private readonly parkingApiUrl: string;

  constructor(
    private mcpTools: McpToolsService,
    private configService: ConfigService,
  ) {
    this.parkingApiUrl = this.configService.get('PARKING_API_URL', 'http://localhost:3000');
  }

  onModuleInit() {
    this.registerParkingTools();
    this.logger.log('Herramientas de estacionamiento MCP registradas');
  }

  private registerParkingTools(): void {
    // ============ HERRAMIENTAS DE CONSULTA DE CLIENTES (SOLO ADMIN) ============

    /**
     * Buscar cliente por email, nombre o placa (SOLO ADMIN)
     */
    this.mcpTools.registerTool({
      name: 'buscar_cliente',
      description: 'Busca información de un cliente por email, nombre o placa de vehículo. Retorna datos del cliente y sus vehículos asociados.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Email del cliente a buscar',
          },
          nombre: {
            type: 'string',
            description: 'Nombre o parte del nombre del cliente',
          },
          placa: {
            type: 'string',
            description: 'Placa de vehículo para encontrar al propietario',
          },
        },
        required: [],
      },
      handler: async (params) => {
        try {
          // Si se busca por placa, primero buscar el vehículo
          if (params.placa) {
            const vehiculoResponse = await fetch(
              `${this.parkingApiUrl}/registro/buscar-vehiculo/${encodeURIComponent(params.placa)}`
            );
            
            if (vehiculoResponse.ok) {
              const vehiculo = await vehiculoResponse.json();
              if (vehiculo && vehiculo.clienteId) {
                const clienteResponse = await fetch(`${this.parkingApiUrl}/clientes/${vehiculo.clienteId}`);
                if (clienteResponse.ok) {
                  const cliente = await clienteResponse.json();
                  return {
                    encontrado: true,
                    busquedaPor: 'placa',
                    cliente: {
                      id: cliente.id,
                      nombre: cliente.nombre,
                      email: cliente.email,
                      telefono: cliente.telefono,
                      vinculadoConUsuario: !!cliente.auth_user_id,
                    },
                    vehiculoEncontrado: {
                      id: vehiculo.id,
                      placa: vehiculo.placa,
                      marca: vehiculo.marca,
                      modelo: vehiculo.modelo,
                    },
                  };
                }
              }
            }
            return { encontrado: false, mensaje: `No se encontró vehículo con placa ${params.placa}` };
          }

          // Buscar por email
          if (params.email) {
            const response = await fetch(
              `${this.parkingApiUrl}/registro/buscar-cliente/${encodeURIComponent(params.email)}`
            );
            
            if (response.ok) {
              const cliente = await response.json();
              return {
                encontrado: true,
                busquedaPor: 'email',
                cliente: {
                  id: cliente.id,
                  nombre: cliente.nombre,
                  email: cliente.email,
                  telefono: cliente.telefono,
                  vinculadoConUsuario: !!cliente.auth_user_id,
                  vehiculos: cliente.vehiculos?.map((v: any) => ({
                    id: v.id,
                    placa: v.placa,
                    marca: v.marca,
                    modelo: v.modelo,
                  })) || [],
                },
              };
            }
            return { encontrado: false, mensaje: `No se encontró cliente con email ${params.email}` };
          }

          // Buscar por nombre (búsqueda parcial)
          if (params.nombre) {
            const response = await fetch(`${this.parkingApiUrl}/clientes`);
            const clientes = await response.json();
            
            const encontrados = clientes.filter((c: any) => 
              c.nombre.toLowerCase().includes(params.nombre.toLowerCase())
            );

            if (encontrados.length > 0) {
              return {
                encontrado: true,
                busquedaPor: 'nombre',
                totalResultados: encontrados.length,
                clientes: encontrados.slice(0, 10).map((c: any) => ({
                  id: c.id,
                  nombre: c.nombre,
                  email: c.email,
                  telefono: c.telefono,
                })),
              };
            }
            return { encontrado: false, mensaje: `No se encontraron clientes con nombre "${params.nombre}"` };
          }

          return { error: 'Debe proporcionar al menos un criterio de búsqueda: email, nombre o placa' };
        } catch (error: any) {
          return { error: `Error al buscar cliente: ${error.message}` };
        }
      },
    });

    /**
     * Ver tickets activos o históricos de un cliente/vehículo (SOLO ADMIN)
     */
    this.mcpTools.registerTool({
      name: 'historial_tickets',
      description: 'Obtiene el historial de tickets de estacionamiento. Puede filtrar por cliente, vehículo o estado.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          clienteId: {
            type: 'string',
            description: 'ID del cliente',
          },
          placa: {
            type: 'string',
            description: 'Placa del vehículo',
          },
          soloActivos: {
            type: 'boolean',
            description: 'Si true, solo muestra tickets sin fecha de salida',
          },
          limite: {
            type: 'number',
            description: 'Número máximo de tickets a retornar (default: 20)',
          },
        },
        required: [],
      },
      handler: async (params) => {
        try {
          // Obtener tickets, vehículos, espacios y secciones en paralelo
          const [ticketsRes, vehiculosRes, espaciosRes, seccionesRes] = await Promise.all([
            fetch(`${this.parkingApiUrl}/tickets`),
            fetch(`${this.parkingApiUrl}/vehiculos`),
            fetch(`${this.parkingApiUrl}/espacios`),
            fetch(`${this.parkingApiUrl}/secciones`),
          ]);
          
          let tickets = await ticketsRes.json();
          const todosVehiculos = await vehiculosRes.json();
          const todosEspacios = await espaciosRes.json();
          const todasSecciones = await seccionesRes.json();

          // Crear mapas para lookup rápido
          const vehiculosMap = new Map(todosVehiculos.map((v: any) => [v.id, v]));
          const espaciosMap = new Map(todosEspacios.map((e: any) => [e.id, e]));
          const seccionesMap = new Map(todasSecciones.map((s: any) => [s.id, s.letraSeccion]));

          // Filtrar por placa
          if (params.placa) {
            tickets = tickets.filter((t: any) => {
              const vehiculo: any = vehiculosMap.get(t.vehiculoId);
              return vehiculo?.placa?.toLowerCase() === params.placa.toLowerCase();
            });
          }

          // Filtrar por cliente
          if (params.clienteId) {
            tickets = tickets.filter((t: any) => {
              const vehiculo: any = vehiculosMap.get(t.vehiculoId);
              return vehiculo?.clienteId === params.clienteId;
            });
          }

          // Filtrar solo activos (sin fecha de salida)
          if (params.soloActivos) {
            tickets = tickets.filter((t: any) => !t.fechaSalida);
          }

          // Ordenar por fecha de ingreso descendente
          tickets.sort((a: any, b: any) => 
            new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
          );

          // Limitar resultados
          const limite = params.limite || 20;
          tickets = tickets.slice(0, limite);

          return {
            totalEncontrados: tickets.length,
            tickets: tickets.map((t: any) => {
              const vehiculo: any = vehiculosMap.get(t.vehiculoId) || {};
              const espacio: any = espaciosMap.get(t.espacioId) || {};
              const seccionLetra = seccionesMap.get(espacio.seccionId) || '';
              
              return {
                id: t.id,
                vehiculo: {
                  placa: vehiculo.placa || 'N/A',
                  marca: vehiculo.marca || '',
                  modelo: vehiculo.modelo || '',
                },
                espacio: {
                  numero: seccionLetra ? `${seccionLetra}-${espacio.numero}` : (espacio.numero || 'N/A'),
                  seccion: seccionLetra,
                },
                fechaIngreso: t.fechaIngreso,
                fechaSalida: t.fechaSalida,
                activo: !t.fechaSalida,
                horasEstacionamiento: t.horas_estacionamiento,
                montoCalculado: t.monto_calculado,
                pagado: !!t.detallePagoId,
              };
            }),
          };
        } catch (error: any) {
          return { error: `Error al obtener historial: ${error.message}` };
        }
      },
    });

    // ============ HERRAMIENTAS DE ACCIÓN (SOLO ADMIN) ============

    /**
     * Registrar ingreso de vehículo (crear ticket) - SOLO ADMIN
     */
    this.mcpTools.registerTool({
      name: 'registrar_ingreso',
      description: 'Registra el ingreso de un vehículo al estacionamiento. Crea un ticket, busca/crea el cliente y asigna un espacio disponible.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          placa: {
            type: 'string',
            description: 'Placa del vehículo (ej: ABC-123)',
          },
          marca: {
            type: 'string',
            description: 'Marca del vehículo (ej: Toyota)',
          },
          modelo: {
            type: 'string',
            description: 'Modelo del vehículo (ej: Corolla)',
          },
          clienteNombre: {
            type: 'string',
            description: 'Nombre del cliente',
          },
          clienteEmail: {
            type: 'string',
            description: 'Email del cliente',
          },
          clienteTelefono: {
            type: 'string',
            description: 'Teléfono del cliente',
          },
          espacio: {
            type: 'string',
            description: 'Espacio en formato LETRA-NUMERO (ej: A-1, B-5, A-10). Si no se especifica, se asigna automáticamente.',
          },
          tipoVehiculo: {
            type: 'string',
            description: 'Tipo de vehículo (ej: Automóvil, Motocicleta, Camioneta)',
          },
        },
        required: ['placa'],
      },
      handler: async (params) => {
        try {
          // Obtener secciones para mapear IDs a letras
          const seccionesRes = await fetch(`${this.parkingApiUrl}/secciones`);
          const secciones = seccionesRes.ok ? await seccionesRes.json() : [];
          
          // Función para obtener letra de sección por ID
          const getLetraSeccion = (seccionId: string) => {
            const seccion = secciones.find((s: any) => s.id === seccionId);
            return seccion?.letraSeccion || '';
          };

          // Si se proporciona número de espacio, buscar el ID
          let espacioId = null;
          let espacioNumero = null;
          let espacioLetra = null;
          
          if (params.espacio) {
            const espaciosRes = await fetch(`${this.parkingApiUrl}/espacios`);
            if (espaciosRes.ok) {
              const espacios = await espaciosRes.json();
              
              // Parsear el input del usuario (ej: "A-01", "A01", "A-1", "A 1")
              const input = String(params.espacio).toUpperCase().trim();
              const match = input.match(/^([A-Z])?[-\s]?(\d+)$/);
              
              let letraBuscada = match ? match[1] : null;
              let numeroBuscado = match ? match[2] : input.replace(/[^0-9]/g, '');
              
              // Buscar el espacio correcto
              const espacioEncontrado = espacios.find((e: any) => {
                const eNumero = String(e.numero || '');
                const eLetra = getLetraSeccion(e.seccionId);
                
                // Si el usuario especificó letra, debe coincidir
                if (letraBuscada) {
                  return eLetra === letraBuscada && 
                         (eNumero === numeroBuscado || eNumero === numeroBuscado.replace(/^0+/, ''));
                }
                // Si no especificó letra, solo buscar por número (puede ser ambiguo)
                return eNumero === numeroBuscado || eNumero === numeroBuscado.replace(/^0+/, '');
              });
              
              if (espacioEncontrado) {
                if (!espacioEncontrado.estado) {
                  const letraEspacio = getLetraSeccion(espacioEncontrado.seccionId);
                  return {
                    success: false,
                    error: `El espacio ${letraEspacio}-${espacioEncontrado.numero} ya está ocupado. Por favor selecciona otro espacio.`,
                  };
                }
                espacioId = espacioEncontrado.id;
                espacioNumero = espacioEncontrado.numero;
                espacioLetra = getLetraSeccion(espacioEncontrado.seccionId);
              } else {
                // Mostrar espacios disponibles organizados por sección
                const disponibles = espacios.filter((e: any) => e.estado === true);
                const porSeccion: { [key: string]: string[] } = {};
                disponibles.forEach((e: any) => {
                  const letra = getLetraSeccion(e.seccionId) || 'Sin sección';
                  if (!porSeccion[letra]) porSeccion[letra] = [];
                  porSeccion[letra].push(e.numero);
                });
                
                const listaFormateada = Object.entries(porSeccion)
                  .map(([letra, nums]) => `${letra}: ${nums.slice(0, 5).join(', ')}`)
                  .join(' | ');
                
                return {
                  success: false,
                  error: `No se encontró el espacio "${params.espacio}". Espacios disponibles: ${listaFormateada}. Usa formato: A-1, B-5, etc.`,
                };
              }
            }
          }

          // Si no hay espacio, buscar uno disponible
          if (!espacioId) {
            const espaciosRes = await fetch(`${this.parkingApiUrl}/espacios`);
            if (espaciosRes.ok) {
              const espacios = await espaciosRes.json();
              const disponible = espacios.find((e: any) => e.estado === true);
              if (disponible) {
                espacioId = disponible.id;
                espacioNumero = disponible.numero;
                espacioLetra = getLetraSeccion(disponible.seccionId);
              } else {
                return {
                  success: false,
                  error: 'No hay espacios disponibles en este momento.',
                };
              }
            }
          }

          // Buscar tipo de vehículo si se especificó
          let tipoVehiculoId = null;
          if (params.tipoVehiculo) {
            const tiposRes = await fetch(`${this.parkingApiUrl}/tipo-vehiculo`);
            if (tiposRes.ok) {
              const tipos = await tiposRes.json();
              const tipoEncontrado = tipos.find((t: any) => 
                t.categoria?.toLowerCase().includes(params.tipoVehiculo.toLowerCase())
              );
              if (tipoEncontrado) {
                tipoVehiculoId = tipoEncontrado.id;
              }
            }
          }

          // Si no se especificó tipo, usar el primero disponible
          if (!tipoVehiculoId) {
            const tiposRes = await fetch(`${this.parkingApiUrl}/tipo-vehiculo`);
            if (tiposRes.ok) {
              const tipos = await tiposRes.json();
              if (tipos.length > 0) {
                tipoVehiculoId = tipos[0].id;
              }
            }
          }

          // Usar el endpoint cliente-completo que registra cliente + vehículo + asigna espacio en una sola llamada
          const registroCompletoRes = await fetch(`${this.parkingApiUrl}/registro/cliente-completo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombreCliente: params.clienteNombre || 'Cliente',
              emailCliente: params.clienteEmail || `${params.placa.replace(/[^a-zA-Z0-9]/g, '')}@temp.com`,
              telefonoCliente: params.clienteTelefono || '0000000000',
              placa: params.placa,
              marca: params.marca || 'No especificada',
              modelo: params.modelo || 'No especificado',
              tipoVehiculoId: tipoVehiculoId,
              espacioId: espacioId,
            }),
          });

          if (registroCompletoRes.ok) {
            const resultado = await registroCompletoRes.json();
            
            // Construir el nombre del espacio con sección
            const nombreEspacio = espacioLetra 
              ? `${espacioLetra}-${espacioNumero}` 
              : espacioNumero || params.espacio;

            // Obtener información de tarifa para el PDF
            let tarifaInfo = null;
            let tipoVehiculoNombre = null;
            if (tipoVehiculoId) {
              const tipoRes = await fetch(`${this.parkingApiUrl}/tipo-vehiculo/${tipoVehiculoId}`);
              if (tipoRes.ok) {
                const tipoData = await tipoRes.json();
                tipoVehiculoNombre = tipoData.categoria;
                if (tipoData.tipotarifa) {
                  tarifaInfo = {
                    precioHora: tipoData.tipotarifa.precioHora,
                    precioDia: tipoData.tipotarifa.precioDia,
                  };
                }
              }
            }

            return {
              success: true,
              mensaje: `✅ Vehículo ${params.placa} ingresado correctamente en el espacio ${nombreEspacio}`,
              ticket: {
                id: resultado.ticket?.id,
                fechaIngreso: resultado.ticket?.fechaIngreso,
              },
              espacio: {
                id: espacioId,
                numero: nombreEspacio,
                seccion: espacioLetra,
              },
              vehiculo: {
                id: resultado.vehiculo?.id,
                placa: params.placa,
                marca: params.marca || 'No especificada',
                modelo: params.modelo || 'No especificado',
              },
              cliente: {
                id: resultado.cliente?.id,
                nombre: params.clienteNombre || 'Cliente',
                telefono: params.clienteTelefono,
              },
              tipoVehiculo: tipoVehiculoNombre ? { categoria: tipoVehiculoNombre } : null,
              tarifa: tarifaInfo,
            };
          }

          // Si falla el registro completo, intentar buscar vehículo existente y solo asignar espacio
          const registroError = await registroCompletoRes.text();
          
          // Verificar si el error es porque el vehículo ya existe
          if (registroError.includes('placa') || registroError.includes('409')) {
            // Buscar el vehículo existente
            const vehiculosRes = await fetch(`${this.parkingApiUrl}/vehiculos`);
            if (vehiculosRes.ok) {
              const vehiculos = await vehiculosRes.json();
              const vehiculoExistente = vehiculos.find((v: any) => 
                v.placa?.toLowerCase() === params.placa.toLowerCase()
              );
              
              if (vehiculoExistente) {
                // Asignar el espacio al vehículo existente
                const asignarRes = await fetch(`${this.parkingApiUrl}/registro/asignar-espacio`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    espacioId: espacioId,
                    vehiculoId: vehiculoExistente.id,
                  }),
                });

                if (asignarRes.ok) {
                  const resultado = await asignarRes.json();
                  
                  const nombreEspacio = espacioLetra 
                    ? `${espacioLetra}-${espacioNumero}` 
                    : espacioNumero || params.espacio;

                  // Obtener información de tarifa para el PDF del vehículo existente
                  let tarifaInfo = null;
                  let tipoVehiculoNombre = null;
                  if (vehiculoExistente.tipoVehiculoId) {
                    const tipoRes = await fetch(`${this.parkingApiUrl}/tipo-vehiculo/${vehiculoExistente.tipoVehiculoId}`);
                    if (tipoRes.ok) {
                      const tipoData = await tipoRes.json();
                      tipoVehiculoNombre = tipoData.categoria;
                      if (tipoData.tipotarifa) {
                        tarifaInfo = {
                          precioHora: tipoData.tipotarifa.precioHora,
                          precioDia: tipoData.tipotarifa.precioDia,
                        };
                      }
                    }
                  }

                  return {
                    success: true,
                    mensaje: `✅ Vehículo ${params.placa} (ya registrado) ingresado en el espacio ${nombreEspacio}`,
                    ticket: {
                      id: resultado.ticket?.id,
                      fechaIngreso: resultado.ticket?.fechaIngreso,
                    },
                    espacio: {
                      id: espacioId,
                      numero: nombreEspacio,
                      seccion: espacioLetra,
                    },
                    vehiculo: {
                      id: vehiculoExistente.id,
                      placa: vehiculoExistente.placa,
                      marca: vehiculoExistente.marca,
                      modelo: vehiculoExistente.modelo,
                    },
                    tipoVehiculo: tipoVehiculoNombre ? { categoria: tipoVehiculoNombre } : null,
                    tarifa: tarifaInfo,
                  };
                } else {
                  const asignarError = await asignarRes.text();
                  return {
                    success: false,
                    error: `No se pudo asignar el espacio: ${asignarError}`,
                  };
                }
              }
            }
          }

          return {
            success: false,
            error: `Error al registrar ingreso: ${registroError}`,
          };
        } catch (error: any) {
          return { success: false, error: `Error al registrar ingreso: ${error.message}` };
        }
      },
    });

    /**
     * Registrar salida de vehículo (cerrar ticket y procesar pago) - SOLO ADMIN
     */
    this.mcpTools.registerTool({
      name: 'registrar_salida',
      description: 'Registra la salida de un vehículo. Calcula el tiempo de estacionamiento, aplica la tarifa y registra el pago.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          placa: {
            type: 'string',
            description: 'Placa del vehículo que sale',
          },
          ticketId: {
            type: 'string',
            description: 'ID del ticket (alternativa a placa)',
          },
          metodoPago: {
            type: 'string',
            description: 'Método de pago utilizado',
            enum: ['efectivo', 'tarjeta', 'transferencia', 'cortesia'],
          },
          confirmarPago: {
            type: 'boolean',
            description: 'Si true, procesa el pago automáticamente. Si false, solo calcula el monto.',
          },
        },
        required: [],
      },
      handler: async (params) => {
        try {
          // Usar el endpoint de desocupar espacio
          const response = await fetch(`${this.parkingApiUrl}/registro/desocupar-espacio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              placa: params.placa,
              ticketId: params.ticketId,
              metodoPago: params.metodoPago || 'efectivo',
              procesarPago: params.confirmarPago !== false,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return { 
              success: false, 
              error: `No se pudo registrar la salida: ${errorText}` 
            };
          }

          const resultado = await response.json();

          return {
            success: true,
            mensaje: params.confirmarPago !== false 
              ? `Vehículo retirado y pago procesado correctamente`
              : `Salida calculada - Monto a pagar: $${resultado.montoTotal}`,
            ticket: {
              id: resultado.ticket?.id,
              fechaIngreso: resultado.ticket?.fechaIngreso,
              fechaSalida: resultado.ticket?.fechaSalida,
            },
            tiempoEstacionamiento: {
              horas: resultado.horasEstacionamiento,
              minutos: Math.round((resultado.horasEstacionamiento % 1) * 60),
            },
            pago: {
              montoTotal: resultado.montoTotal,
              tarifaAplicada: resultado.tarifaAplicada,
              metodoPago: params.metodoPago || 'efectivo',
              procesado: params.confirmarPago !== false,
            },
            espacioLiberado: {
              id: resultado.espacio?.id,
              numero: resultado.espacio?.numero,
            },
          };
        } catch (error: any) {
          return { success: false, error: `Error al registrar salida: ${error.message}` };
        }
      },
    });

    // ============ HERRAMIENTAS DE REPORTE (SOLO ADMIN) ============

    /**
     * Reporte operativo diario - SOLO ADMIN
     */
    this.mcpTools.registerTool({
      name: 'reporte_operativo',
      description: 'Genera un resumen operativo completo del estacionamiento incluyendo ingresos, tickets, multas y ocupación.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          fecha: {
            type: 'string',
            description: 'Fecha del reporte (formato YYYY-MM-DD). Por defecto es hoy.',
          },
        },
        required: [],
      },
      timeout: 20000,
      handler: async (params) => {
        try {
          const fechaReporte = params.fecha ? new Date(params.fecha) : new Date();
          const inicioDelDia = new Date(fechaReporte.getFullYear(), fechaReporte.getMonth(), fechaReporte.getDate());
          const finDelDia = new Date(inicioDelDia.getTime() + 24 * 60 * 60 * 1000);

          // Obtener datos en paralelo
          const [espaciosRes, ticketsRes, pagosRes, multasRes] = await Promise.all([
            fetch(`${this.parkingApiUrl}/espacios`),
            fetch(`${this.parkingApiUrl}/tickets`),
            fetch(`${this.parkingApiUrl}/detalle-pago`),
            fetch(`${this.parkingApiUrl}/multas`),
          ]);

          const espacios = await espaciosRes.json();
          const todosTickets = await ticketsRes.json();
          const todosPagos = await pagosRes.json();
          const todasMultas = await multasRes.json();

          // Filtrar por fecha
          const ticketsHoy = todosTickets.filter((t: any) => {
            const fecha = new Date(t.fechaIngreso);
            return fecha >= inicioDelDia && fecha < finDelDia;
          });

          const pagosHoy = todosPagos.filter((p: any) => {
            const fecha = new Date(p.fecha_pago);
            return fecha >= inicioDelDia && fecha < finDelDia;
          });

          const multasHoy = todasMultas.filter((m: any) => {
            const fecha = new Date(m.fecha_multa);
            return fecha >= inicioDelDia && fecha < finDelDia;
          });

          // Calcular estadísticas
          const espaciosDisponibles = espacios.filter((e: any) => e.estado === true).length;
          const espaciosOcupados = espacios.filter((e: any) => e.estado === false).length;
          const totalEspacios = espacios.length;

          const ticketsActivos = todosTickets.filter((t: any) => !t.fechaSalida).length;
          
          const ingresosTotales = pagosHoy.reduce((sum: number, p: any) => sum + (p.pago_total || 0), 0);
          
          const multasPendientes = multasHoy.filter((m: any) => m.estado === 'pendiente').length;
          const ingresosPorMultas = multasHoy
            .filter((m: any) => m.estado === 'pagada')
            .reduce((sum: number, m: any) => sum + (m.monto_total || 0), 0);

          // Agrupar pagos por método
          const pagosPorMetodo = pagosHoy.reduce((acc: any, p: any) => {
            const metodo = p.metodo || 'otro';
            acc[metodo] = (acc[metodo] || 0) + (p.pago_total || 0);
            return acc;
          }, {});

          return {
            fecha: inicioDelDia.toISOString().split('T')[0],
            ocupacion: {
              total: totalEspacios,
              disponibles: espaciosDisponibles,
              ocupados: espaciosOcupados,
              porcentajeOcupacion: totalEspacios > 0 
                ? ((espaciosOcupados / totalEspacios) * 100).toFixed(1) + '%'
                : 'N/A',
            },
            tickets: {
              generadosHoy: ticketsHoy.length,
              activosActualmente: ticketsActivos,
              cerradosHoy: ticketsHoy.filter((t: any) => t.fechaSalida).length,
            },
            ingresos: {
              total: ingresosTotales,
              porEstacionamiento: ingresosTotales - ingresosPorMultas,
              porMultas: ingresosPorMultas,
              cantidadTransacciones: pagosHoy.length,
              promedioTicket: pagosHoy.length > 0 ? (ingresosTotales / pagosHoy.length).toFixed(2) : 0,
              desglosePorMetodo: pagosPorMetodo,
            },
            multas: {
              registradasHoy: multasHoy.length,
              pendientes: multasPendientes,
              pagadas: multasHoy.length - multasPendientes,
            },
            resumen: `Día ${params.fecha || 'de hoy'}: ${ticketsHoy.length} vehículos, $${ingresosTotales.toFixed(2)} recaudados, ${espaciosOcupados}/${totalEspacios} espacios ocupados`,
          };
        } catch (error: any) {
          return { error: `Error al generar reporte: ${error.message}` };
        }
      },
    });

    /**
     * Consultar tarifas vigentes (DISPONIBLE PARA TODOS)
     */
    this.mcpTools.registerTool({
      name: 'consultar_tarifas',
      description: 'Obtiene las tarifas de estacionamiento vigentes.',
      allowedRoles: ['admin', 'operator', 'user'], // Todos pueden ver tarifas
      parameters: {
        type: 'object',
        properties: {
          tipoVehiculo: {
            type: 'string',
            description: 'Filtrar por tipo de vehículo',
          },
        },
        required: [],
      },
      handler: async (params) => {
        try {
          const [tarifasRes, tiposVehiculoRes] = await Promise.all([
            fetch(`${this.parkingApiUrl}/tipo-tarifa`),
            fetch(`${this.parkingApiUrl}/tipo-vehiculo`),
          ]);

          const tarifas = await tarifasRes.json();
          const tiposVehiculo = await tiposVehiculoRes.json();

          // Relacionar tarifas con tipos de vehículo
          const tarifasCompletas = tarifas.map((t: any) => {
            const vehiculosAplicables = tiposVehiculo
              .filter((v: any) => v.tipoTarifaId === t.id)
              .map((v: any) => v.categoria);

            return {
              id: t.id,
              nombre: t.tipo_tarifa,
              precioHora: t.precio_hora,
              precioDia: t.precio_dia,
              vehiculosAplicables,
            };
          });

          if (params.tipoVehiculo) {
            const filtradas = tarifasCompletas.filter((t: any) => 
              t.vehiculosAplicables.some((v: string) => 
                v.toLowerCase().includes(params.tipoVehiculo.toLowerCase())
              )
            );
            return { tarifas: filtradas };
          }

          return { 
            tarifas: tarifasCompletas,
            nota: 'Los precios están en la moneda local configurada',
          };
        } catch (error: any) {
          return { error: `Error al consultar tarifas: ${error.message}` };
        }
      },
    });

    /**
     * Registrar multa - SOLO ADMIN
     */
    this.mcpTools.registerTool({
      name: 'registrar_multa',
      description: 'Registra una multa a un vehículo o ticket.',
      allowedRoles: ['admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          placa: {
            type: 'string',
            description: 'Placa del vehículo',
          },
          ticketId: {
            type: 'string',
            description: 'ID del ticket asociado',
          },
          tipoMultaId: {
            type: 'string',
            description: 'ID del tipo de multa a aplicar',
          },
          descripcion: {
            type: 'string',
            description: 'Descripción o motivo de la multa',
          },
        },
        required: ['descripcion'],
      },
      handler: async (params) => {
        try {
          // Primero obtener el tipo de multa si no se especifica
          let tipoMultaId = params.tipoMultaId;
          let montoMulta = 0;

          if (!tipoMultaId) {
            const tiposRes = await fetch(`${this.parkingApiUrl}/tipo-multa`);
            const tipos = await tiposRes.json();
            if (tipos.length > 0) {
              tipoMultaId = tipos[0].id;
              montoMulta = tipos[0].monto;
            }
          } else {
            const tipoRes = await fetch(`${this.parkingApiUrl}/tipo-multa/${tipoMultaId}`);
            if (tipoRes.ok) {
              const tipo = await tipoRes.json();
              montoMulta = tipo.monto;
            }
          }

          // Buscar vehículo por placa si se proporciona
          let vehiculoId = null;
          if (params.placa) {
            const vehiculoRes = await fetch(`${this.parkingApiUrl}/registro/buscar-vehiculo/${params.placa}`);
            if (vehiculoRes.ok) {
              const vehiculo = await vehiculoRes.json();
              vehiculoId = vehiculo.id;
            }
          }

          // Crear la multa
          const response = await fetch(`${this.parkingApiUrl}/multas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              descripcion: params.descripcion,
              monto_total: montoMulta,
              tipoMultaId: tipoMultaId,
              ticketId: params.ticketId,
              vehiculoId: vehiculoId,
              estado: 'pendiente',
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `No se pudo registrar la multa: ${errorText}` };
          }

          const multa = await response.json();

          return {
            success: true,
            mensaje: `Multa registrada correctamente`,
            multa: {
              id: multa.id,
              descripcion: params.descripcion,
              monto: montoMulta,
              estado: 'pendiente',
              vehiculoPlaca: params.placa,
              ticketId: params.ticketId,
            },
          };
        } catch (error: any) {
          return { success: false, error: `Error al registrar multa: ${error.message}` };
        }
      },
    });

    // ============ HERRAMIENTAS PARA USUARIOS (DISPONIBLE PARA TODOS) ============

    /**
     * Buscar espacios disponibles (TODOS LOS USUARIOS)
     */
    this.mcpTools.registerTool({
      name: 'buscar_espacios',
      description: 'Busca espacios de estacionamiento disponibles. Muestra cuántos hay libres y su ubicación.',
      allowedRoles: ['admin', 'operator', 'user'],
      parameters: {
        type: 'object',
        properties: {
          zona: {
            type: 'string',
            description: 'Filtrar por zona o sección (A, B, C, etc.)',
          },
        },
        required: [],
      },
      handler: async (params) => {
        try {
          const response = await fetch(`${this.parkingApiUrl}/espacios`);
          const espacios = await response.json();

          let filtrados = espacios;
          if (params.zona) {
            filtrados = espacios.filter((e: any) => 
              e.seccion?.letra_seccion?.toLowerCase() === params.zona.toLowerCase()
            );
          }

          const disponibles = filtrados.filter((e: any) => e.estado === true);
          const ocupados = filtrados.filter((e: any) => e.estado === false);

          // Agrupar por sección
          const porSeccion = disponibles.reduce((acc: any, e: any) => {
            const seccion = e.seccion?.letra_seccion || 'Sin asignar';
            if (!acc[seccion]) {
              acc[seccion] = { total: 0, espacios: [] };
            }
            acc[seccion].total++;
            acc[seccion].espacios.push({
              id: e.id,
              numero: e.numero,
            });
            return acc;
          }, {});

          return {
            resumen: {
              totalEspacios: filtrados.length,
              disponibles: disponibles.length,
              ocupados: ocupados.length,
              porcentajeOcupacion: filtrados.length > 0 
                ? ((ocupados.length / filtrados.length) * 100).toFixed(1) + '%'
                : 'N/A',
            },
            espaciosDisponibles: porSeccion,
            mensaje: disponibles.length > 0 
              ? `Hay ${disponibles.length} espacios disponibles`
              : 'No hay espacios disponibles en este momento',
          };
        } catch (error: any) {
          return { error: `Error al buscar espacios: ${error.message}` };
        }
      },
    });

    /**
     * Ver reservas activas del usuario (USUARIOS)
     */
    this.mcpTools.registerTool({
      name: 'mis_reservas_activas',
      description: 'Muestra las reservas/tickets activos del usuario actual. Requiere que el usuario esté vinculado a un cliente.',
      allowedRoles: ['user', 'admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          userEmail: {
            type: 'string',
            description: 'Email del usuario para buscar sus reservas',
          },
        },
        required: [],
      },
      handler: async (params) => {
        try {
          if (!params.userEmail) {
            return { 
              mensaje: 'Para ver tus reservas, necesito tu email de usuario.',
              error: 'Email no proporcionado'
            };
          }

          // Buscar cliente por email
          const clienteRes = await fetch(
            `${this.parkingApiUrl}/registro/buscar-cliente/${encodeURIComponent(params.userEmail)}`
          );
          
          if (!clienteRes.ok) {
            return { 
              encontrado: false,
              mensaje: 'No tienes un perfil de cliente asociado. Visita el estacionamiento para crear uno.',
            };
          }

          const cliente = await clienteRes.json();
          
          // Obtener tickets, vehículos, espacios y secciones
          const [ticketsRes, vehiculosRes, espaciosRes, seccionesRes] = await Promise.all([
            fetch(`${this.parkingApiUrl}/tickets`),
            fetch(`${this.parkingApiUrl}/vehiculos`),
            fetch(`${this.parkingApiUrl}/espacios`),
            fetch(`${this.parkingApiUrl}/secciones`),
          ]);
          
          const todosTickets = await ticketsRes.json();
          const todosVehiculos = await vehiculosRes.json();
          const todosEspacios = await espaciosRes.json();
          const todasSecciones = await seccionesRes.json();

          // Crear mapas para lookup rápido
          const vehiculosMap = new Map(todosVehiculos.map((v: any) => [v.id, v]));
          const espaciosMap = new Map(todosEspacios.map((e: any) => [e.id, e]));
          const seccionesMap = new Map(todasSecciones.map((s: any) => [s.id, s.letraSeccion]));

          // Filtrar tickets activos de los vehículos del cliente
          const vehiculoIds = cliente.vehiculos?.map((v: any) => v.id) || [];
          const ticketsActivos = todosTickets.filter((t: any) => 
            !t.fechaSalida && vehiculoIds.includes(t.vehiculoId)
          );

          if (ticketsActivos.length === 0) {
            return {
              encontrado: true,
              cliente: cliente.nombre,
              mensaje: 'No tienes reservas activas en este momento.',
              reservasActivas: [],
            };
          }

          return {
            encontrado: true,
            cliente: cliente.nombre,
            totalReservasActivas: ticketsActivos.length,
            reservasActivas: ticketsActivos.map((t: any) => {
              const vehiculo: any = vehiculosMap.get(t.vehiculoId) || {};
              const espacio: any = espaciosMap.get(t.espacioId) || {};
              const seccionLetra = seccionesMap.get(espacio.seccionId) || '';
              
              return {
                ticketId: t.id,
                vehiculo: {
                  placa: vehiculo.placa || 'N/A',
                  marca: vehiculo.marca || '',
                  modelo: vehiculo.modelo || '',
                },
                espacio: {
                  numero: seccionLetra ? `${seccionLetra}-${espacio.numero}` : espacio.numero,
                  seccion: seccionLetra,
                },
                fechaIngreso: t.fechaIngreso,
                tiempoEstacionado: this.calcularTiempo(t.fechaIngreso),
              };
            }),
          };
        } catch (error: any) {
          return { error: `Error al obtener reservas: ${error.message}` };
        }
      },
    });

    /**
     * Ver historial de reservas del usuario (USUARIOS)
     */
    this.mcpTools.registerTool({
      name: 'mi_historial',
      description: 'Muestra el historial de reservas anteriores del usuario.',
      allowedRoles: ['user', 'admin', 'operator'],
      parameters: {
        type: 'object',
        properties: {
          userEmail: {
            type: 'string',
            description: 'Email del usuario para buscar su historial',
          },
          limite: {
            type: 'number',
            description: 'Cantidad de registros a mostrar (default: 10)',
          },
        },
        required: [],
      },
      handler: async (params) => {
        try {
          if (!params.userEmail) {
            return { 
              mensaje: 'Para ver tu historial, necesito tu email de usuario.',
              error: 'Email no proporcionado'
            };
          }

          // Buscar cliente por email
          const clienteRes = await fetch(
            `${this.parkingApiUrl}/registro/buscar-cliente/${encodeURIComponent(params.userEmail)}`
          );
          
          if (!clienteRes.ok) {
            return { 
              encontrado: false,
              mensaje: 'No tienes un perfil de cliente asociado.',
            };
          }

          const cliente = await clienteRes.json();
          
          // Obtener tickets, vehículos, espacios y secciones
          const [ticketsRes, vehiculosRes, espaciosRes, seccionesRes] = await Promise.all([
            fetch(`${this.parkingApiUrl}/tickets`),
            fetch(`${this.parkingApiUrl}/vehiculos`),
            fetch(`${this.parkingApiUrl}/espacios`),
            fetch(`${this.parkingApiUrl}/secciones`),
          ]);
          
          const todosTickets = await ticketsRes.json();
          const todosVehiculos = await vehiculosRes.json();
          const todosEspacios = await espaciosRes.json();
          const todasSecciones = await seccionesRes.json();

          // Crear mapas para lookup rápido
          const vehiculosMap = new Map(todosVehiculos.map((v: any) => [v.id, v]));
          const espaciosMap = new Map(todosEspacios.map((e: any) => [e.id, e]));
          const seccionesMap = new Map(todasSecciones.map((s: any) => [s.id, s.letraSeccion]));

          // Filtrar tickets completados de los vehículos del cliente
          const vehiculoIds = cliente.vehiculos?.map((v: any) => v.id) || [];
          const ticketsCompletados = todosTickets
            .filter((t: any) => t.fechaSalida && vehiculoIds.includes(t.vehiculoId))
            .sort((a: any, b: any) => 
              new Date(b.fechaSalida).getTime() - new Date(a.fechaSalida).getTime()
            )
            .slice(0, params.limite || 10);

          if (ticketsCompletados.length === 0) {
            return {
              encontrado: true,
              cliente: cliente.nombre,
              mensaje: 'No tienes reservas anteriores registradas.',
              historial: [],
            };
          }

          return {
            encontrado: true,
            cliente: cliente.nombre,
            totalRegistros: ticketsCompletados.length,
            historial: ticketsCompletados.map((t: any) => {
              const vehiculo: any = vehiculosMap.get(t.vehiculoId) || {};
              const espacio: any = espaciosMap.get(t.espacioId) || {};
              const seccionLetra = seccionesMap.get(espacio.seccionId) || '';
              
              return {
                ticketId: t.id,
                vehiculo: vehiculo.placa || 'N/A',
                espacio: seccionLetra ? `${seccionLetra}-${espacio.numero}` : (espacio.numero || 'N/A'),
                fechaIngreso: t.fechaIngreso,
                fechaSalida: t.fechaSalida,
                duracion: `${t.horas_estacionamiento || 0} horas`,
                montoPagado: t.monto_calculado ? `Bs. ${t.monto_calculado}` : 'N/A',
              };
            }),
          };
        } catch (error: any) {
          return { error: `Error al obtener historial: ${error.message}` };
        }
      },
    });
  }

  /**
   * Calcula tiempo transcurrido desde una fecha
   */
  private calcularTiempo(fechaIngreso: string): string {
    const ahora = new Date();
    const ingreso = new Date(fechaIngreso);
    const diffMs = ahora.getTime() - ingreso.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHoras === 0) {
      return `${diffMinutos} minutos`;
    }
    return `${diffHoras} horas ${diffMinutos} min`;
  }
}
