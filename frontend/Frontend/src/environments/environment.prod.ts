/**
 * Archivo de configuración de entorno de PRODUCCIÓN
 * 
 * Este archivo contiene las URLs de los servicios para producción.
 * Actualiza estas URLs según tu infraestructura de producción.
 */
export const environment = {
  production: true,
  
  // URL del API REST (Backend NestJS)
  // Ejemplo: 'https://api.tudominio.com'
  apiUrl: 'https://your-production-api.com',
  
  // URL del servicio GraphQL (Python FastAPI + Strawberry)
  // Ejemplo: 'https://graphql.tudominio.com/graphql'
  graphqlUrl: 'https://your-production-graphql.com/graphql',
  
  // URL del servidor WebSocket (Go)
  // Ejemplo: 'wss://ws.tudominio.com/ws'
  websocketUrl: 'wss://your-production-websocket.com/ws',
  
  // Configuración de reconexión WebSocket
  websocketReconnectAttempts: 5,
  websocketReconnectDelay: 3000,
};
