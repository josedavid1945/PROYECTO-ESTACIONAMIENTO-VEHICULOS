package websocket

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/josedavid1945/estacionamiento-websocket/internal/service/dashboard"
)

// Hub mantiene el conjunto de clientes activos y transmite mensajes
type Hub struct {
	// Clientes registrados
	Clients map[*Client]bool

	// Broadcast envía mensajes a todos los clientes
	Broadcast chan []byte

	// Registrar nuevos clientes
	Register chan *Client

	// Cancelar registro de clientes
	Unregister chan *Client

	// Servicio de dashboard
	Service *dashboard.Service

	// Intervalo de actualización automática
	UpdateInterval time.Duration

	// Mutex para acceso concurrente
	mu sync.RWMutex

	// Contexto para cancelar actualizaciones
	ctx    context.Context
	cancel context.CancelFunc
}

// NewHub crea una nueva instancia del Hub
func NewHub(service *dashboard.Service, updateInterval time.Duration) *Hub {
	ctx, cancel := context.WithCancel(context.Background())
	return &Hub{
		Clients:        make(map[*Client]bool),
		Broadcast:      make(chan []byte, 256),
		Register:       make(chan *Client),
		Unregister:     make(chan *Client),
		Service:        service,
		UpdateInterval: updateInterval,
		ctx:            ctx,
		cancel:         cancel,
	}
}

// Run inicia el Hub
func (h *Hub) Run() {
	// Iniciar actualizaciones automáticas
	go h.startAutoUpdates()

	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			log.Printf("Cliente conectado: %s. Total clientes: %d", client.ID, len(h.Clients))

			// Enviar datos iniciales al nuevo cliente
			go client.sendDashboardUpdate()

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				log.Printf("Cliente desconectado: %s. Total clientes: %d", client.ID, len(h.Clients))
			}
			h.mu.Unlock()

		case message := <-h.Broadcast:
			h.mu.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					// Cliente no puede recibir, eliminar
					h.mu.RUnlock()
					h.mu.Lock()
					delete(h.Clients, client)
					client.Close()
					h.mu.Unlock()
					h.mu.RLock()
				}
			}
			h.mu.RUnlock()
		}
	}
}

// startAutoUpdates envía actualizaciones periódicas del dashboard
func (h *Hub) startAutoUpdates() {
	ticker := time.NewTicker(h.UpdateInterval * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			h.broadcastDashboardUpdate()
		case <-h.ctx.Done():
			return
		}
	}
}

// broadcastDashboardUpdate envía actualización del dashboard a todos los clientes
func (h *Hub) broadcastDashboardUpdate() {
	data, err := h.Service.GetDashboardData(h.ctx)
	if err != nil {
		log.Printf("Error obteniendo datos del dashboard para broadcast: %v", err)
		return
	}

	h.mu.RLock()
	clientCount := len(h.Clients)
	clients := make([]*Client, 0, clientCount)
	for client := range h.Clients {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	// Enviar a todos los clientes
	for _, client := range clients {
		client.BroadcastDashboardUpdate(data)
	}

	if clientCount > 0 {
		log.Printf("Dashboard actualizado y enviado a %d clientes", clientCount)
	}
}

// GetClientCount devuelve el número de clientes conectados
func (h *Hub) GetClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.Clients)
}

// Shutdown detiene el Hub de forma ordenada
func (h *Hub) Shutdown() {
	log.Println("Cerrando Hub...")
	h.cancel()

	h.mu.Lock()
	defer h.mu.Unlock()

	// Cerrar todas las conexiones de clientes
	for client := range h.Clients {
		client.Close()
		delete(h.Clients, client)
	}

	log.Println("Hub cerrado")
}
