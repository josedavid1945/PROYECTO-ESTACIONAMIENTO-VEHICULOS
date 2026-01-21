package websocket

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/josedavid1945/estacionamiento-websocket/internal/service/dashboard"
)

// getAllowedOrigins devuelve los orígenes permitidos desde variable de entorno
func getAllowedOrigins() []string {
	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		// Orígenes por defecto para desarrollo y producción
		return []string{
			"http://localhost",
			"http://localhost:80",
			"http://localhost:4200",
			"http://localhost:3000",
			"http://127.0.0.1",
			"http://127.0.0.1:4200",
			"http://127.0.0.1:80",
			"https://parking-frontend-g7vl.onrender.com",
		}
	}
	return strings.Split(origins, ",")
}

// isAllowedOrigin verifica si el origen está permitido (incluye .onrender.com)
func isAllowedOrigin(origin string) bool {
	// Permitir cualquier subdominio de onrender.com
	if strings.HasSuffix(origin, ".onrender.com") {
		return true
	}
	// Verificar contra orígenes permitidos explícitos
	for _, allowed := range getAllowedOrigins() {
		if strings.TrimSpace(allowed) == origin {
			return true
		}
	}
	return false
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		// En desarrollo, si no hay origen, permitir (para testing)
		if origin == "" {
			return true
		}
		// Verificar con la función centralizada
		if isAllowedOrigin(origin) {
			return true
		}
		log.Printf("Origen WebSocket rechazado: %s", origin)
		return false
	},
}

// Handler maneja las conexiones WebSocket
type Handler struct {
	Hub     *Hub
	Service *dashboard.Service
}

// NewHandler crea una nueva instancia del handler
func NewHandler(hub *Hub, service *dashboard.Service) *Handler {
	return &Handler{
		Hub:     hub,
		Service: service,
	}
}

// ServeWS maneja las solicitudes de upgrade a WebSocket
func (h *Handler) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error al actualizar a WebSocket: %v", err)
		return
	}

	client := NewClient(conn, h.Hub, h.Service)
	h.Hub.Register <- client

	// Iniciar goroutines para lectura y escritura
	go client.WritePump()
	go client.ReadPump()
}

// HealthCheck endpoint de salud
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := fmt.Sprintf(`{"status":"ok","clients":%d}`, h.Hub.GetClientCount())
	w.Write([]byte(response))
}
