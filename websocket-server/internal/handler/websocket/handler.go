package websocket

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/josedavid1945/estacionamiento-websocket/internal/service/dashboard"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// En producción, verificar el origen adecuadamente
		return true
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
