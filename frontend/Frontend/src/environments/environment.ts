/**
 * Configuración centralizada de endpoints del proyecto
 * 
 * Este archivo centraliza todas las URLs de los servicios para facilitar
 * la configuración en diferentes ambientes (desarrollo, producción)
 */

export const environment = {
  production: false,
  
  // Backend REST API (NestJS)
  apiUrl: 'http://localhost:3000',
  
  // Auth Service (NestJS) - Microservicio de autenticación
  authUrl: 'http://localhost:3002',
  
  // GraphQL Service (Python/FastAPI)
  graphqlUrl: 'http://127.0.0.1:8000/graphql',
  
  // WebSocket Server (Go)
  websocketUrl: 'ws://localhost:8080/ws',

  // B2B Webhooks & MCP Chat Service (NestJS)
  b2bApiUrl: 'http://localhost:3001',
  
  // Configuración adicional
  reconnectAttempts: 5,
  reconnectDelay: 3000, // ms
  websocketUpdateInterval: 5000, // ms
  websocketReconnectAttempts: 5,
  websocketReconnectDelay: 3000, // ms
};

/**
 * Configuración para producción
 * Descomentar y ajustar cuando se despliegue
 */
// export const environment = {
//   production: true,
//   apiUrl: 'https://api.tu-dominio.com',
//   graphqlUrl: 'https://graphql.tu-dominio.com/graphql',
//   websocketUrl: 'wss://ws.tu-dominio.com/ws',
//   reconnectAttempts: 10,
//   reconnectDelay: 5000,
//   websocketUpdateInterval: 10000,
// };
