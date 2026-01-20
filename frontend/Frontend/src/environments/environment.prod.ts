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
  apiUrl: 'https://parking-backend-rest-g7vl.onrender.com',
  
  // URL del Auth Service (Microservicio de Autenticación) - Puerto 3002
  authUrl: 'https://parking-auth-service-g7vl.onrender.com',
  
  // URL del servicio GraphQL (Python/Strawberry) - Puerto 8000
  graphqlUrl: 'https://parking-graphql-g7vl.onrender.com/graphql',
  
  // URL del servidor WebSocket (Go) - Puerto 8080
  // Nota: Render soporta WSS automáticamente en servicios web
  websocketUrl: 'wss://parking-websocket-g7vl.onrender.com/ws',
  
  // URL del servicio B2B Webhooks (Chatbot/MCP) - Puerto 3001
  b2bApiUrl: 'https://parking-b2b-webhooks-g7vl.onrender.com',
  
  // Configuración adicional
  reconnectAttempts: 10,
  reconnectDelay: 5000,
  websocketUpdateInterval: 10000,
  websocketReconnectAttempts: 5,
  websocketReconnectDelay: 3000,
};
