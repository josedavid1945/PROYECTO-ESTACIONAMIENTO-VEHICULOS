# 🌐 Backend REST API - API Principal del Sistema

> **API REST principal para gestión de estacionamiento con PostgreSQL y TypeORM**  
> Puerto: 3000 | Tecnología: NestJS + TypeScript + PostgreSQL

---

## 📋 Descripción General

El **Backend REST API** es el servicio principal del sistema de gestión de estacionamiento. Proporciona una API REST completa y robusta para todas las operaciones CRUD del negocio, implementada con NestJS y TypeORM para máxima escalabilidad y mantenibilidad.

### 🎯 Responsabilidades Principales

- **CRUD completo** de todas las entidades del sistema
- **Lógica de negocio** central del estacionamiento
- **Gestión de transacciones** y pagos
- **Validación de datos** robusta
- **Integración con base de datos** PostgreSQL
- **API RESTful** con documentación Swagger

---

## 🏗️ Arquitectura del Backend

### Estructura del Proyecto
```
backend-rest/
├── API - copia/              # 🔧 Implementación actual
│   ├── alquiler-rest/       # 📁 Módulo principal
│   │   ├── src/
│   │   │   ├── entities/    # 🎯 Entidades de base de datos
│   │   │   │   ├── cliente.entity.ts
│   │   │   │   ├── vehiculo.entity.ts
│   │   │   │   ├── espacio.entity.ts
│   │   │   │   ├── ticket.entity.ts
│   │   │   │   ├── pago.entity.ts
│   │   │   │   └── tarifa.entity.ts
│   │   │   ├── controllers/ # 🎮 Controladores REST
│   │   │   │   ├── cliente.controller.ts
│   │   │   │   ├── vehiculo.controller.ts
│   │   │   │   ├── parking.controller.ts
│   │   │   │   └── payment.controller.ts
│   │   │   ├── services/    # 🔧 Lógica de negocio
│   │   │   │   ├── cliente.service.ts
│   │   │   │   ├── parking.service.ts
│   │   │   │   └── payment.service.ts
│   │   │   ├── dto/         # 📝 Data Transfer Objects
│   │   │   │   ├── create-cliente.dto.ts
│   │   │   │   ├── create-ticket.dto.ts
│   │   │   │   └── payment.dto.ts
│   │   │   └── modules/     # 📦 Módulos organizados
│   │   │       ├── cliente.module.ts
│   │   │       ├── parking.module.ts
│   │   │       └── payment.module.ts
│   │   ├── app.module.ts    # 🚀 Módulo principal
│   │   └── main.ts          # 🎯 Punto de entrada
│   └── package.json         # 📦 Dependencias
```

### Stack Tecnológico
- **Framework**: NestJS (TypeScript)
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM
- **Validación**: class-validator, class-transformer
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

---

## 🎯 Entidades del Sistema

### 1. Cliente Entity 👤
```typescript
@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 15 })
  telefono: string;

  @CreateDateColumn()
  fechaRegistro: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;

  @OneToMany(() => Vehiculo, vehiculo => vehiculo.cliente)
  vehiculos: Vehiculo[];

  @OneToMany(() => Ticket, ticket => ticket.cliente)
  tickets: Ticket[];
}
```

### 2. Vehículo Entity 🚗
```typescript
@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10, unique: true })
  placa: string;

  @Column({ length: 50 })
  marca: string;

  @Column({ length: 50 })
  modelo: string;

  @Column({ length: 30 })
  color: string;

  @Column()
  año: number;

  @ManyToOne(() => Cliente, cliente => cliente.vehiculos)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column()
  clienteId: number;

  @OneToMany(() => Ticket, ticket => ticket.vehiculo)
  tickets: Ticket[];
}
```

### 3. Espacio Entity 🅿️
```typescript
@Entity('espacios')
export class Espacio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10, unique: true })
  numero: string;

  @Column({
    type: 'enum',
    enum: ['normal', 'discapacitado', 'electrico', 'motocicleta'],
    default: 'normal'
  })
  tipo: TipoEspacio;

  @Column({
    type: 'enum',
    enum: ['libre', 'ocupado', 'reservado', 'mantenimiento'],
    default: 'libre'
  })
  estado: EstadoEspacio;

  @Column('decimal', { precision: 8, scale: 2 })
  tarifaHora: number;

  @Column({ length: 100 })
  ubicacion: string;

  @OneToMany(() => Ticket, ticket => ticket.espacio)
  tickets: Ticket[];

  @ManyToOne(() => TipoTarifa, tarifa => tarifa.espacios)
  @JoinColumn({ name: 'tipo_tarifa_id' })
  tipoTarifa: TipoTarifa;
}
```

### 4. Ticket Entity 🎫
```typescript
@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  fechaEntrada: Date;

  @Column({ nullable: true })
  fechaSalida: Date;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  totalCalculado: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  totalPagado: number;

  @Column({
    type: 'enum',
    enum: ['activo', 'pagado', 'cancelado'],
    default: 'activo'
  })
  estado: EstadoTicket;

  @ManyToOne(() => Vehiculo, vehiculo => vehiculo.tickets)
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @ManyToOne(() => Cliente, cliente => cliente.tickets)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Espacio, espacio => espacio.tickets)
  @JoinColumn({ name: 'espacio_id' })
  espacio: Espacio;

  @OneToMany(() => DetallePago, pago => pago.ticket)
  pagos: DetallePago[];
}
```

### 5. Detalle Pago Entity 💳
```typescript
@Entity('detalle_pagos')
export class DetallePago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 8, scale: 2 })
  monto: number;

  @Column({
    type: 'enum',
    enum: ['efectivo', 'tarjeta', 'transferencia', 'digital'],
    default: 'efectivo'
  })
  metodoPago: MetodoPago;

  @CreateDateColumn()
  fechaPago: Date;

  @Column({
    type: 'enum',
    enum: ['pendiente', 'completado', 'fallido'],
    default: 'completado'
  })
  estado: EstadoPago;

  @Column({ length: 100, nullable: true })
  referencia: string;

  @ManyToOne(() => Ticket, ticket => ticket.pagos)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;
}
```

---

## 🚀 Controladores y Endpoints

### Cliente Controller 👤
```typescript
@ApiTags('Clientes')
@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  async create(@Body() createClienteDto: CreateClienteDto): Promise<Cliente> {
    return this.clienteService.create(createClienteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los clientes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string
  ): Promise<PaginatedResult<Cliente>> {
    return this.clienteService.findAll(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async findOne(@Param('id') id: string): Promise<Cliente> {
    return this.clienteService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  async update(
    @Param('id') id: string,
    @Body() updateClienteDto: UpdateClienteDto
  ): Promise<Cliente> {
    return this.clienteService.update(+id, updateClienteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cliente' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clienteService.remove(+id);
  }
}
```

### Parking Controller 🅿️
```typescript
@ApiTags('Estacionamiento')
@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  @Get('espacios')
  @ApiOperation({ summary: 'Obtener todos los espacios' })
  async getEspacios(
    @Query('estado') estado?: EstadoEspacio,
    @Query('tipo') tipo?: TipoEspacio
  ): Promise<Espacio[]> {
    return this.parkingService.getEspacios(estado, tipo);
  }

  @Get('disponibles')
  @ApiOperation({ summary: 'Obtener espacios disponibles' })
  async getEspaciosDisponibles(): Promise<Espacio[]> {
    return this.parkingService.getEspaciosDisponibles();
  }

  @Post('entrada')
  @ApiOperation({ summary: 'Registrar entrada de vehículo' })
  @ApiResponse({ status: 201, description: 'Ticket de entrada generado' })
  async registrarEntrada(
    @Body() entradaDto: RegistrarEntradaDto
  ): Promise<Ticket> {
    return this.parkingService.registrarEntrada(entradaDto);
  }

  @Put('salida/:ticketId')
  @ApiOperation({ summary: 'Registrar salida de vehículo' })
  async registrarSalida(
    @Param('ticketId') ticketId: string
  ): Promise<TicketSalidaResult> {
    return this.parkingService.registrarSalida(+ticketId);
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas del estacionamiento' })
  async getEstadisticas(): Promise<EstadisticasParking> {
    return this.parkingService.getEstadisticas();
  }

  @Get('ocupacion/:fecha')
  @ApiOperation({ summary: 'Obtener ocupación por fecha' })
  async getOcupacionPorFecha(
    @Param('fecha') fecha: string
  ): Promise<OcupacionData[]> {
    return this.parkingService.getOcupacionPorFecha(fecha);
  }
}
```

### Payment Controller 💳
```typescript
@ApiTags('Pagos')
@Controller('pagos')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Procesar pago de ticket' })
  async procesarPago(
    @Body() pagoDto: ProcesarPagoDto
  ): Promise<DetallePago> {
    return this.paymentService.procesarPago(pagoDto);
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Obtener pagos de un ticket' })
  async getPagosByTicket(
    @Param('ticketId') ticketId: string
  ): Promise<DetallePago[]> {
    return this.paymentService.getPagosByTicket(+ticketId);
  }

  @Get('reportes/diario')
  @ApiOperation({ summary: 'Reporte de ingresos diario' })
  async getReporteDiario(
    @Query('fecha') fecha?: string
  ): Promise<ReporteIngresos> {
    return this.paymentService.getReporteDiario(fecha);
  }

  @Get('metodos')
  @ApiOperation({ summary: 'Estadísticas por método de pago' })
  async getEstadisticasMetodosPago(): Promise<MetodoPagoStats[]> {
    return this.paymentService.getEstadisticasMetodosPago();
  }
}
```

---

## 🔄 Relaciones con Otros Servicios

### 📤 Servicios que CONSUMEN Backend REST

1. **Frontend Angular** 🖥️
   - CRUD de todas las entidades
   - Operaciones de estacionamiento
   - Gestión de pagos
   - Reportes y estadísticas

2. **B2B Webhooks System** 🤖
   - Consultas de datos para chatbot
   - Operaciones automatizadas
   - Validación de información

3. **GraphQL Service** 📊
   - Consultas optimizadas
   - Agregación de datos
   - Operaciones complejas

### 📥 Servicios que Backend REST CONSUME

1. **Base de Datos PostgreSQL** 🗄️
   - Almacenamiento de todas las entidades
   - Transacciones ACID
   - Consultas optimizadas

2. **Auth Service** 🔐
   - Validación de tokens JWT
   - Autorización de usuarios
   - Verificación de permisos

---

## 💼 Servicios de Negocio

### Parking Service
```typescript
@Injectable()
export class ParkingService {
  constructor(
    @InjectRepository(Espacio)
    private espacioRepo: Repository<Espacio>,
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,
    private readonly tarifaService: TarifaService
  ) {}

  async registrarEntrada(entradaDto: RegistrarEntradaDto): Promise<Ticket> {
    // Buscar espacio disponible
    const espacio = await this.buscarEspacioDisponible(entradaDto.tipoEspacio);
    
    if (!espacio) {
      throw new BadRequestException('No hay espacios disponibles');
    }

    // Crear ticket
    const ticket = this.ticketRepo.create({
      vehiculoId: entradaDto.vehiculoId,
      clienteId: entradaDto.clienteId,
      espacioId: espacio.id,
      fechaEntrada: new Date()
    });

    // Actualizar estado del espacio
    espacio.estado = EstadoEspacio.OCUPADO;
    
    // Guardar en transacción
    return this.ticketRepo.manager.transaction(async manager => {
      await manager.save(espacio);
      const savedTicket = await manager.save(ticket);
      
      // Notificar cambio de estado
      await this.notificarCambioEstado(espacio, 'ocupado');
      
      return savedTicket;
    });
  }

  async registrarSalida(ticketId: number): Promise<TicketSalidaResult> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId, estado: EstadoTicket.ACTIVO },
      relations: ['espacio', 'vehiculo', 'cliente']
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado o ya procesado');
    }

    const fechaSalida = new Date();
    const tiempoEstacionado = fechaSalida.getTime() - ticket.fechaEntrada.getTime();
    const horasEstacionado = Math.ceil(tiempoEstacionado / (1000 * 60 * 60));
    
    // Calcular total a pagar
    const totalCalculado = await this.tarifaService.calcularTarifa(
      ticket.espacio.tipoTarifa,
      horasEstacionado
    );

    // Actualizar ticket
    ticket.fechaSalida = fechaSalida;
    ticket.totalCalculado = totalCalculado;
    ticket.espacio.estado = EstadoEspacio.LIBRE;

    return this.ticketRepo.manager.transaction(async manager => {
      await manager.save(ticket);
      await manager.save(ticket.espacio);
      
      // Notificar liberación del espacio
      await this.notificarCambioEstado(ticket.espacio, 'libre');
      
      return {
        ticket,
        totalAPagar: totalCalculado,
        tiempoEstacionado: horasEstacionado
      };
    });
  }

  async getEstadisticas(): Promise<EstadisticasParking> {
    const [totalEspacios, espaciosOcupados, ticketsActivos] = await Promise.all([
      this.espacioRepo.count(),
      this.espacioRepo.count({ where: { estado: EstadoEspacio.OCUPADO } }),
      this.ticketRepo.count({ where: { estado: EstadoTicket.ACTIVO } })
    ]);

    const espaciosLibres = totalEspacios - espaciosOcupados;
    const porcentajeOcupacion = (espaciosOcupados / totalEspacios) * 100;

    return {
      totalEspacios,
      espaciosLibres,
      espaciosOcupados,
      ticketsActivos,
      porcentajeOcupacion: Math.round(porcentajeOcupacion * 100) / 100
    };
  }

  private async notificarCambioEstado(espacio: Espacio, nuevoEstado: string): Promise<void> {
    // Integración con sistema de notificaciones
    // WebSocket o eventos para notificación en tiempo real
  }
}
```

### Payment Service
```typescript
@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(DetallePago)
    private pagoRepo: Repository<DetallePago>,
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>
  ) {}

  async procesarPago(pagoDto: ProcesarPagoDto): Promise<DetallePago> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: pagoDto.ticketId },
      relations: ['pagos']
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    // Validar que el monto sea correcto
    const totalPagado = ticket.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
    const saldoPendiente = ticket.totalCalculado - totalPagado;

    if (pagoDto.monto > saldoPendiente) {
      throw new BadRequestException('El monto excede el saldo pendiente');
    }

    // Crear registro de pago
    const pago = this.pagoRepo.create({
      ticketId: ticket.id,
      monto: pagoDto.monto,
      metodoPago: pagoDto.metodoPago,
      referencia: pagoDto.referencia,
      estado: EstadoPago.COMPLETADO
    });

    return this.pagoRepo.manager.transaction(async manager => {
      const savedPago = await manager.save(pago);
      
      // Actualizar total pagado del ticket
      ticket.totalPagado = totalPagado + Number(pagoDto.monto);
      
      // Si se pagó completamente, cambiar estado del ticket
      if (ticket.totalPagado >= ticket.totalCalculado) {
        ticket.estado = EstadoTicket.PAGADO;
      }
      
      await manager.save(ticket);
      
      return savedPago;
    });
  }

  async getReporteDiario(fecha?: string): Promise<ReporteIngresos> {
    const targetDate = fecha ? new Date(fecha) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const pagosDelDia = await this.pagoRepo.find({
      where: {
        fechaPago: Between(startOfDay, endOfDay),
        estado: EstadoPago.COMPLETADO
      },
      relations: ['ticket']
    });

    const totalIngresos = pagosDelDia.reduce((sum, pago) => sum + Number(pago.monto), 0);
    const totalTransacciones = pagosDelDia.length;
    
    const ingresosPorMetodo = pagosDelDia.reduce((acc, pago) => {
      acc[pago.metodoPago] = (acc[pago.metodoPago] || 0) + Number(pago.monto);
      return acc;
    }, {});

    return {
      fecha: targetDate,
      totalIngresos,
      totalTransacciones,
      ingresosPorMetodo,
      pagos: pagosDelDia
    };
  }
}
```

---

## 🔧 Configuración y Variables de Entorno

```env
# Aplicación
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Base de Datos
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=parking_db
DB_SSL=false
DB_SYNCHRONIZE=false  # Solo en desarrollo
DB_LOGGING=true

# JWT (para validación)
JWT_SECRET=your-secret-key

# Configuración de Negocio
TIEMPO_GRACIA_MINUTOS=15
TARIFA_BASE_HORA=5.00
MAX_HORAS_ESTACIONAMIENTO=24

# Integración con otros servicios
WEBSOCKET_SERVICE_URL=http://localhost:8080
NOTIFICATION_SERVICE_URL=http://localhost:3001

# CORS
CORS_ORIGINS=http://localhost:4200,http://localhost:3000

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
LOG_FORMAT=combined
```

---

## 🔧 DTOs y Validación

### Create Cliente DTO
```typescript
export class CreateClienteDto {
  @IsString()
  @Length(2, 100)
  @ApiProperty({ description: 'Nombre completo del cliente' })
  nombre: string;

  @IsEmail()
  @ApiProperty({ description: 'Email único del cliente' })
  email: string;

  @IsString()
  @Matches(/^\+?[\d\s\-\(\)]{10,15}$/)
  @ApiProperty({ description: 'Número de teléfono' })
  telefono: string;
}
```

### Registrar Entrada DTO
```typescript
export class RegistrarEntradaDto {
  @IsNumber()
  @ApiProperty({ description: 'ID del vehículo' })
  vehiculoId: number;

  @IsNumber()
  @ApiProperty({ description: 'ID del cliente' })
  clienteId: number;

  @IsEnum(TipoEspacio)
  @IsOptional()
  @ApiProperty({ description: 'Tipo de espacio preferido', required: false })
  tipoEspacio?: TipoEspacio;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'ID del espacio específico', required: false })
  espacioId?: number;
}
```

### Procesar Pago DTO
```typescript
export class ProcesarPagoDto {
  @IsNumber()
  @ApiProperty({ description: 'ID del ticket a pagar' })
  ticketId: number;

  @IsNumber()
  @Min(0.01)
  @ApiProperty({ description: 'Monto del pago' })
  monto: number;

  @IsEnum(MetodoPago)
  @ApiProperty({ description: 'Método de pago utilizado' })
  metodoPago: MetodoPago;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Referencia del pago', required: false })
  referencia?: string;
}
```

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run start:dev

# Build para producción
npm run build

# Ejecutar migraciones
npm run typeorm:migration:run

# Generar migración
npm run typeorm:migration:generate -- -n MigrationName

# Seeds de datos
npm run seed

# Tests
npm run test
npm run test:e2e
npm run test:cov

# Linting
npm run lint
npm run format
```

---

## 📊 Swagger Documentation

### Configuración Swagger
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Parking Management API')
    .setDescription('API REST para gestión de estacionamiento')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Clientes', 'Gestión de clientes')
    .addTag('Vehículos', 'Gestión de vehículos')
    .addTag('Estacionamiento', 'Operaciones de estacionamiento')
    .addTag('Pagos', 'Procesamiento de pagos')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3000);
}
```

### Acceso a Documentación
```
http://localhost:3000/api/docs
```

---

## 🔍 Testing y Quality Assurance

### Unit Tests
```typescript
describe('ParkingService', () => {
  let service: ParkingService;
  let espacioRepo: Repository<Espacio>;
  let ticketRepo: Repository<Ticket>;

  beforeEach(async () => {
    const module = await Test.createTestModule({
      providers: [
        ParkingService,
        { provide: getRepositoryToken(Espacio), useClass: Repository },
        { provide: getRepositoryToken(Ticket), useClass: Repository }
      ]
    }).compile();

    service = module.get<ParkingService>(ParkingService);
    espacioRepo = module.get<Repository<Espacio>>(getRepositoryToken(Espacio));
    ticketRepo = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
  });

  it('should register vehicle entry', async () => {
    // Test implementation
  });
});
```

### E2E Tests
```typescript
describe('Parking (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/parking/entrada (POST)', () => {
    return request(app.getHttpServer())
      .post('/parking/entrada')
      .send({
        vehiculoId: 1,
        clienteId: 1
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.fechaEntrada).toBeDefined();
      });
  });
});
```

---

## 📊 Performance y Optimización

### Database Indexing
```typescript
@Entity('tickets')
@Index(['fechaEntrada', 'estado'])
@Index(['vehiculoId', 'estado'])
export class Ticket {
  // Entity definition
}
```

### Query Optimization
```typescript
async findActiveTickets(): Promise<Ticket[]> {
  return this.ticketRepo.createQueryBuilder('ticket')
    .leftJoinAndSelect('ticket.vehiculo', 'vehiculo')
    .leftJoinAndSelect('ticket.cliente', 'cliente')
    .leftJoinAndSelect('ticket.espacio', 'espacio')
    .where('ticket.estado = :estado', { estado: EstadoTicket.ACTIVO })
    .orderBy('ticket.fechaEntrada', 'DESC')
    .getMany();
}
```

### Caching Strategy
```typescript
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getEstadisticas(): Promise<EstadisticasParking> {
    const cached = await this.cacheManager.get('parking:stats');
    if (cached) {
      return cached;
    }

    const stats = await this.calculateStats();
    await this.cacheManager.set('parking:stats', stats, { ttl: 300 }); // 5 minutos
    return stats;
  }
}
```

---

## 🐳 Docker y Despliegue

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Docker Compose Integration
```yaml
backend-rest:
  build: ./backend-rest/API - copia
  container_name: parking-backend-rest
  ports:
    - "3000:3000"
  environment:
    - NODE_ENV=production
    - DB_HOST=postgres
    - DB_PORT=5432
  depends_on:
    - postgres
    - auth-service
  networks:
    - parking-network
```