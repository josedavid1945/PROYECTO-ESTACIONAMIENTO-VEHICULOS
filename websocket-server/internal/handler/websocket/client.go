package websocket

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/josedavid1945/estacionamiento-websocket/internal/domain/models"
	"github.com/josedavid1945/estacionamiento-websocket/internal/service/dashboard"
)

// Client representa un cliente WebSocket conectado
type Client struct {
	ID         string
	Conn       *websocket.Conn
	Send       chan []byte
	Hub        *Hub
	Service    *dashboard.Service
	closeMutex sync.Mutex
	closed     bool
}

// Message estructura de mensaje WebSocket
type Message struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data,omitempty"`
}

// NewClient crea un nuevo cliente WebSocket
func NewClient(conn *websocket.Conn, hub *Hub, service *dashboard.Service) *Client {
	return &Client{
		ID:      generateClientID(),
		Conn:    conn,
		Send:    make(chan []byte, 256),
		Hub:     hub,
		Service: service,
		closed:  false,
	}
}

// ReadPump lee mensajes del cliente
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, messageBytes, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error inesperado en WebSocket: %v", err)
			}
			break
		}

		// Procesar mensaje recibido
		var msg Message
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			log.Printf("Error al parsear mensaje: %v", err)
			continue
		}

		c.handleMessage(msg)
	}
}

// WritePump envía mensajes al cliente
func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Agregar mensajes en cola
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage procesa los mensajes recibidos del cliente
func (c *Client) handleMessage(msg Message) {
	switch msg.Type {
	case "get_dashboard":
		c.sendDashboardUpdate()
	case "get_espacios_por_seccion":
		c.sendEspaciosPorSeccion()
	case "get_espacios_disponibles":
		c.sendEspaciosDisponibles()
	case "get_tickets_activos":
		c.sendTicketsActivos()
	default:
		log.Printf("Tipo de mensaje desconocido: %s", msg.Type)
	}
}

// sendDashboardUpdate envía actualización completa del dashboard
func (c *Client) sendDashboardUpdate() {
	ctx := context.Background()
	data, err := c.Service.GetDashboardData(ctx)
	if err != nil {
		log.Printf("Error obteniendo datos del dashboard: %v", err)
		c.sendError("Error al obtener datos del dashboard")
		return
	}

	c.sendMessage("dashboard_update", data)
}

// sendEspaciosPorSeccion envía espacios agrupados por sección
func (c *Client) sendEspaciosPorSeccion() {
	ctx := context.Background()
	secciones, err := c.Service.GetEspaciosPorSeccion(ctx)
	if err != nil {
		log.Printf("Error obteniendo espacios por sección: %v", err)
		c.sendError("Error al obtener espacios por sección")
		return
	}

	c.sendMessage("espacios_por_seccion", secciones)
}

// sendEspaciosDisponibles envía lista de espacios disponibles
func (c *Client) sendEspaciosDisponibles() {
	ctx := context.Background()
	espacios, err := c.Service.GetEspaciosDisponibles(ctx)
	if err != nil {
		log.Printf("Error obteniendo espacios disponibles: %v", err)
		c.sendError("Error al obtener espacios disponibles")
		return
	}

	c.sendMessage("espacios_disponibles", espacios)
}

// sendTicketsActivos envía tickets activos
func (c *Client) sendTicketsActivos() {
	ctx := context.Background()
	tickets, err := c.Service.GetTicketsActivos(ctx)
	if err != nil {
		log.Printf("Error obteniendo tickets activos: %v", err)
		c.sendError("Error al obtener tickets activos")
		return
	}

	c.sendMessage("tickets_activos", tickets)
}

// sendMessage envía un mensaje al cliente
func (c *Client) sendMessage(messageType string, data interface{}) {
	msg := Message{
		Type: messageType,
	}

	if data != nil {
		dataBytes, err := json.Marshal(data)
		if err != nil {
			log.Printf("Error marshaling data: %v", err)
			return
		}
		msg.Data = dataBytes
	}

	messageBytes, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	select {
	case c.Send <- messageBytes:
	default:
		log.Printf("Canal de envío lleno para cliente %s", c.ID)
	}
}

// sendError envía un mensaje de error al cliente
func (c *Client) sendError(errorMsg string) {
	c.sendMessage("error", map[string]string{"message": errorMsg})
}

// Close cierra la conexión del cliente de forma segura
func (c *Client) Close() {
	c.closeMutex.Lock()
	defer c.closeMutex.Unlock()

	if c.closed {
		return
	}

	c.closed = true
	close(c.Send)
	c.Conn.Close()
}

// generateClientID genera un ID único para el cliente
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + string(rune(time.Now().UnixNano()%26+65))
}

// BroadcastDashboardUpdate envía actualización del dashboard a todos los clientes
func (c *Client) BroadcastDashboardUpdate(data *models.DashboardData) {
	c.sendMessage("dashboard_update", data)
}

// BroadcastEspacioOcupado notifica que un espacio fue ocupado
func (c *Client) BroadcastEspacioOcupado(event *models.EspacioOcupadoEvent) {
	c.sendMessage("espacio_ocupado", event)
}

// BroadcastEspacioLiberado notifica que un espacio fue liberado
func (c *Client) BroadcastEspacioLiberado(event *models.EspacioLiberadoEvent) {
	c.sendMessage("espacio_liberado", event)
}
