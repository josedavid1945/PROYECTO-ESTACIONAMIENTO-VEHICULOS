/**
 * Archivo de configuración de entorno de PRODUCCIÓN
 * 
 * Este archivo contiene las URLs de los servicios desplegados en Render.
 * Las URLs se generan automáticamente por Render con el formato:
 * https://{nombre-servicio}.onrender.com
 */
export const environment = {
  production: true,
  
  // URL del API REST (Backend NestJS) - Puerto 3000
  apiUrl: 'http://localhost:3000',
  
  // URL del Auth Service (Microservicio de Autenticación) - Puerto 3001
  authUrl: 'http://localhost:3001',
  
  // URL del servicio GraphQL (Python/Strawberry) - Puerto 8000
  graphqlUrl: 'http://localhost:8000/graphql',
  
  // URL del servidor WebSocket (Go) - Puerto 8080
  websocketUrl: 'ws://localhost:8080/ws',
  
  // URL del servicio B2B Webhooks (Chatbot/MCP) - Puerto 3001
  b2bApiUrl: 'http://localhost:3001',
  
  // Configuración adicional
  reconnectAttempts: 10,
  reconnectDelay: 5000,
  websocketUpdateInterval: 10000,
  websocketReconnectAttempts: 5,
  websocketReconnectDelay: 3000,
};
