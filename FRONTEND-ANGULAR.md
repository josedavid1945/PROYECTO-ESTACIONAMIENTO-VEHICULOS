# 🖥️ Frontend Angular - Interfaz de Usuario Moderna

> **Aplicación Angular moderna con diseño responsivo y tiempo real**  
> Puerto: 4200 | Tecnología: Angular 20 + TailwindCSS + Apollo GraphQL

---

## 📋 Descripción General

El **Frontend Angular** es una aplicación web moderna y responsiva que proporciona la interfaz de usuario principal para el sistema de gestión de estacionamiento. Implementa las mejores prácticas de Angular 20 con un diseño elegante usando TailwindCSS y comunicación eficiente a través de GraphQL y WebSockets.

### 🎯 Características Principales

- **Angular 20** con las últimas características
- **Diseño responsivo** con TailwindCSS
- **Apollo GraphQL** para consultas eficientes
- **WebSockets** para actualizaciones en tiempo real
- **PWA Ready** para experiencia móvil optimizada
- **Componentes reutilizables** y modulares

---

## 🏗️ Arquitectura del Frontend

### Estructura del Proyecto
```
frontend/Frontend/
├── src/
│   ├── app/
│   │   ├── components/          # 🧩 Componentes reutilizables
│   │   │   ├── header/
│   │   │   ├── sidebar/
│   │   │   ├── parking-grid/
│   │   │   └── dashboard-stats/
│   │   ├── pages/              # 📄 Páginas principales
│   │   │   ├── dashboard/
│   │   │   ├── parking/
│   │   │   ├── clients/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── services/           # 🔧 Servicios Angular
│   │   │   ├── auth.service.ts
│   │   │   ├── graphql.service.ts
│   │   │   ├── websocket.service.ts
│   │   │   └── parking.service.ts
│   │   ├── guards/             # 🛡️ Guards de ruta
│   │   │   ├── auth.guard.ts
│   │   │   └── admin.guard.ts
│   │   ├── interceptors/       # ⚡ Interceptors HTTP
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   ├── models/             # 🎯 Modelos TypeScript
│   │   │   ├── user.model.ts
│   │   │   ├── parking.model.ts
│   │   │   └── ticket.model.ts
│   │   └── shared/             # 📚 Módulos compartidos
│   │       ├── pipes/
│   │       ├── directives/
│   │       └── utils/
│   ├── assets/                 # 📁 Recursos estáticos
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   └── environments/           # ⚙️ Configuraciones
│       ├── environment.ts
│       └── environment.prod.ts
├── angular.json                # 🔧 Configuración Angular
├── package.json               # 📦 Dependencias
├── tailwind.config.js         # 🎨 Configuración TailwindCSS
├── Dockerfile                 # 🐳 Containerización
└── nginx.conf                 # 🌐 Configuración Nginx
```

### Stack Tecnológico
- **Framework**: Angular 20
- **UI**: TailwindCSS + Angular Material
- **Estado**: RxJS + Services
- **GraphQL**: Apollo Client
- **Tiempo Real**: WebSockets
- **Autenticación**: JWT + Guards

---

## 🎨 Diseño y UI/UX

### TailwindCSS Integration
```json
// package.json dependencies
{
  "@tailwindcss/postcss": "^4.1.16",
  "tailwindcss": "^4.1.16",
  "autoprefixer": "^10.4.20"
}
```

### Componentes de UI Principales

1. **Dashboard Stats** 📊
```typescript
@Component({
  selector: 'app-dashboard-stats',
  template: `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100">
            <i class="fas fa-car text-blue-600"></i>
          </div>
          <div class="ml-4">
            <p class="text-gray-600">Espacios Totales</p>
            <p class="text-2xl font-semibold">{{ stats.totalEspacios }}</p>
          </div>
        </div>
      </div>
      <!-- Más cards de estadísticas -->
    </div>
  `
})
export class DashboardStatsComponent { }
```

2. **Parking Grid** 🅿️
```typescript
@Component({
  selector: 'app-parking-grid',
  template: `
    <div class="grid grid-cols-10 gap-2 p-4">
      <div 
        *ngFor="let espacio of espacios" 
        [class]="getEspacioClass(espacio)"
        (click)="selectEspacio(espacio)"
      >
        {{ espacio.numero }}
      </div>
    </div>
  `,
  styles: [`
    .espacio-libre { @apply bg-green-200 hover:bg-green-300 cursor-pointer; }
    .espacio-ocupado { @apply bg-red-200 cursor-not-allowed; }
    .espacio-reservado { @apply bg-yellow-200 hover:bg-yellow-300; }
  `]
})
export class ParkingGridComponent { }
```

---

## 🔄 Servicios y Comunicación

### GraphQL Service
```typescript
@Injectable({ providedIn: 'root' })
export class GraphQLService {
  constructor(private apollo: Apollo) {}
  
  // Query para obtener estado del estacionamiento
  getParkingStatus(): Observable<any> {
    return this.apollo.watchQuery({
      query: gql`
        query GetParkingStatus {
          espacios {
            id
            numero
            estado
            tipo
          }
          estadisticas {
            totalEspacios
            espaciosLibres
            espaciosOcupados
          }
        }
      `
    }).valueChanges;
  }
  
  // Mutation para crear ticket
  createTicket(vehicleData: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateTicket($input: TicketInput!) {
          createTicket(input: $input) {
            id
            fechaEntrada
            espacio {
              numero
            }
          }
        }
      `,
      variables: { input: vehicleData }
    });
  }
}
```

### WebSocket Service
```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket;
  private messageSubject = new Subject<any>();
  
  connect(): void {
    const token = localStorage.getItem('authToken');
    this.ws = new WebSocket(`ws://localhost:8080/ws`);
    
    this.ws.onopen = () => {
      this.send({ action: 'auth', token });
      this.send({ 
        action: 'subscribe', 
        filters: ['parking_updates', 'new_tickets', 'payments'] 
      });
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageSubject.next(message);
    };
    
    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 5000); // Reconexión automática
    };
  }
  
  getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }
  
  private send(message: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```

---

## 🔄 Relaciones con Otros Servicios

### 📤 Servicios que Frontend CONSUME

1. **Auth Service** 🔐
   - Login/Logout de usuarios
   - Validación de tokens JWT
   - Gestión de sesiones

2. **GraphQL Service** 📊
   - Consultas optimizadas de datos
   - Operaciones CRUD eficientes
   - Caché de Apollo Client

3. **WebSocket Server** ⚡
   - Notificaciones en tiempo real
   - Updates automáticos de UI
   - Estado del estacionamiento live

4. **B2B Webhooks System** 🤖
   - Interacción con chatbot IA
   - Configuración de webhooks
   - Gestión de partners

### 📥 Frontend NO es consumido directamente
El frontend es la interfaz de usuario final y no expone APIs para otros servicios.

---

## 🚀 Páginas y Componentes Principales

### 1. Dashboard Page 📊
```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>
      <div class="flex">
        <app-sidebar></app-sidebar>
        <main class="flex-1 p-8">
          <app-dashboard-stats [stats]="stats"></app-dashboard-stats>
          <app-parking-grid 
            [espacios]="espacios" 
            (espacioSelected)="onEspacioSelected($event)">
          </app-parking-grid>
          <app-recent-activities [activities]="recentActivities"></app-recent-activities>
        </main>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  espacios: Espacio[] = [];
  recentActivities: any[] = [];
  
  ngOnInit(): void {
    this.loadDashboardData();
    this.subscribeToRealTimeUpdates();
  }
  
  private loadDashboardData(): void {
    this.graphqlService.getParkingStatus().subscribe({
      next: (data) => {
        this.espacios = data.data.espacios;
        this.stats = data.data.estadisticas;
      }
    });
  }
  
  private subscribeToRealTimeUpdates(): void {
    this.websocketService.getMessages().subscribe({
      next: (message) => {
        switch (message.type) {
          case 'parking_update':
            this.updateEspacioStatus(message.data);
            break;
          case 'stats_update':
            this.stats = message.data;
            break;
        }
      }
    });
  }
}
```

### 2. Parking Management Page 🅿️
```typescript
@Component({
  selector: 'app-parking',
  template: `
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Gestión de Estacionamiento</h1>
        <button 
          class="bg-blue-600 text-white px-4 py-2 rounded-lg"
          (click)="openNewTicketModal()">
          Nuevo Ticket
        </button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Vista de espacios -->
        <div class="lg:col-span-2">
          <app-parking-grid 
            [espacios]="espacios"
            [mode]="'management'"
            (espacioAction)="handleEspacioAction($event)">
          </app-parking-grid>
        </div>
        
        <!-- Panel de información -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">Información del Espacio</h3>
          <div *ngIf="selectedEspacio">
            <!-- Detalles del espacio seleccionado -->
          </div>
        </div>
      </div>
    </div>
  `
})
export class ParkingComponent { }
```

### 3. Client Management Page 👥
```typescript
@Component({
  selector: 'app-clients',
  template: `
    <div class="container mx-auto p-6">
      <div class="bg-white rounded-lg shadow-md">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">Gestión de Clientes</h1>
            <button class="bg-green-600 text-white px-4 py-2 rounded-lg">
              Nuevo Cliente
            </button>
          </div>
          
          <!-- Barra de búsqueda -->
          <div class="mt-4">
            <input 
              type="text" 
              placeholder="Buscar cliente..."
              class="w-full px-4 py-2 border rounded-lg"
              (input)="filterClients($event)">
          </div>
        </div>
        
        <!-- Tabla de clientes -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left">Nombre</th>
                <th class="px-6 py-3 text-left">Email</th>
                <th class="px-6 py-3 text-left">Teléfono</th>
                <th class="px-6 py-3 text-left">Vehículos</th>
                <th class="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let client of filteredClients" class="border-b">
                <td class="px-6 py-4">{{ client.nombre }}</td>
                <td class="px-6 py-4">{{ client.email }}</td>
                <td class="px-6 py-4">{{ client.telefono }}</td>
                <td class="px-6 py-4">{{ client.vehiculos.length }}</td>
                <td class="px-6 py-4">
                  <button class="text-blue-600 hover:underline mr-3">Editar</button>
                  <button class="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ClientsComponent { }
```

---

## 🔐 Autenticación y Seguridad

### Auth Guard
```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}
```

### Auth Interceptor
```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}
```

---

## ⚙️ Configuración y Variables de Entorno

### environment.ts
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  authServiceUrl: 'http://localhost:3002',
  graphqlUrl: 'http://localhost:8000/graphql',
  websocketUrl: 'ws://localhost:8080/ws',
  b2bServiceUrl: 'http://localhost:3001',
  features: {
    chatbot: true,
    realTimeUpdates: true,
    darkMode: true
  }
};
```

### environment.prod.ts
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.parking-system.com',
  authServiceUrl: 'https://auth.parking-system.com',
  graphqlUrl: 'https://graphql.parking-system.com/graphql',
  websocketUrl: 'wss://ws.parking-system.com/ws',
  b2bServiceUrl: 'https://b2b.parking-system.com',
  features: {
    chatbot: true,
    realTimeUpdates: true,
    darkMode: true
  }
};
```

---

## 📊 Estado y Gestión de Datos

### State Management Service
```typescript
@Injectable({ providedIn: 'root' })
export class AppStateService {
  private stateSubject = new BehaviorSubject({
    user: null,
    parkingSpaces: [],
    stats: {},
    notifications: []
  });
  
  state$ = this.stateSubject.asObservable();
  
  updateParkingSpaces(spaces: Espacio[]): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      parkingSpaces: spaces
    });
  }
  
  updateStats(stats: any): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      stats: stats
    });
  }
  
  addNotification(notification: any): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      notifications: [notification, ...currentState.notifications]
    });
  }
}
```

---

## 🎨 Responsive Design

### TailwindCSS Configuration
```javascript
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

### Responsive Grid System
```css
/* Clases Tailwind para responsividad */
.parking-grid {
  @apply grid gap-2;
  @apply grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15;
}

.dashboard-stats {
  @apply grid gap-4;
  @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-4;
}
```

---

## 📱 Progressive Web App (PWA)

### Service Worker
```typescript
// Configuración PWA en angular.json
"serviceWorker": true,
"ngswConfigPath": "ngsw-config.json"
```

### Características PWA
- **Instalable** en dispositivos móviles
- **Offline support** básico
- **Push notifications** (futuro)
- **App shell** optimizado

---

## 🔧 Build y Despliegue

### Comandos de Desarrollo
```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
ng serve

# Build para producción
ng build --configuration=production

# Tests unitarios
ng test

# Tests E2E
ng e2e

# Linting
ng lint
```

### Docker Configuration
```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend:3000/;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://websocket-server:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📊 Features y Funcionalidades

### 1. Dashboard en Tiempo Real
- **Estadísticas live** del estacionamiento
- **Gráficos interactivos** con Chart.js
- **Notificaciones push** en tiempo real
- **Filtros dinámicos** de datos

### 2. Gestión de Estacionamiento
- **Vista de cuadrícula** del estacionamiento
- **Asignación manual** de espacios
- **Generación de tickets** instantánea
- **Control de entrada/salida**

### 3. Gestión de Clientes
- **CRUD completo** de clientes
- **Búsqueda y filtros** avanzados
- **Historial de tickets** por cliente
- **Gestión de vehículos** múltiples

### 4. Reportes y Analytics
- **Reportes automáticos** diarios/mensuales
- **Gráficos de ocupación** históricos
- **Análisis de ingresos**
- **Exportación a PDF/Excel**

### 5. Configuración del Sistema
- **Gestión de tarifas**
- **Configuración de espacios**
- **Usuarios y permisos**
- **Integración con partners**

---

## 🚀 Performance y Optimización

### Lazy Loading
```typescript
const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'parking',
    loadChildren: () => import('./pages/parking/parking.module').then(m => m.ParkingModule)
  }
];
```

### OnPush Change Detection
```typescript
@Component({
  selector: 'app-parking-space',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class ParkingSpaceComponent { }
```

### Apollo Client Caching
```typescript
const apolloConfig: ApolloClientOptions<any> = {
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Espacio: {
        fields: {
          estado: {
            merge: true
          }
        }
      }
    }
  })
};
```