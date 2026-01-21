package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/josedavid1945/estacionamiento-websocket/internal/config"
	wsHandler "github.com/josedavid1945/estacionamiento-websocket/internal/handler/websocket"
	"github.com/josedavid1945/estacionamiento-websocket/internal/repository/postgres"
	"github.com/josedavid1945/estacionamiento-websocket/internal/service/dashboard"
	"github.com/josedavid1945/estacionamiento-websocket/pkg/database"
)

func main() {
	// Cargar configuración
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatal(err)
	}

	log.Println("🚀 Iniciando WebSocket Server para Panel de Control de Estacionamiento")
	log.Printf("📍 Puerto: %s", cfg.WSPort)
	log.Printf("📍 Path: %s", cfg.WSPath)
	log.Printf("🔄 Intervalo de actualización: %d segundos", cfg.UpdateInterval)
	log.Printf("🔌 Modo: %s", cfg.Mode)
	if cfg.Mode == "rest" {
		log.Printf("🌐 REST API URL: %s", cfg.RestAPIURL)
	}

	var dashboardService *dashboard.Service

	// Decidir si usar REST API o base de datos directa
	if cfg.Mode == "rest" {
		// Modo REST: obtener datos del REST API vía HTTP
		log.Println("✅ Configurado para usar REST API")
		dashboardService = dashboard.NewServiceWithRestAPI(cfg.RestAPIURL)
	} else {
		// Modo DATABASE: consultar directamente PostgreSQL
		log.Println("✅ Configurado para consultar base de datos directamente")
		
		// Conectar a la base de datos
		db, err := database.Connect(cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("Error al conectar a la base de datos: %v", err)
		}
		defer database.Close(db)

		// Inicializar repositorios
		dashboardRepo := postgres.NewDashboardRepository(db)
		ticketRepo := postgres.NewTicketRepository(db)
		vehiculoRepo := postgres.NewVehiculoRepository(db)

		// Inicializar servicio con repositorios
		dashboardService = dashboard.NewService(dashboardRepo, ticketRepo, vehiculoRepo)
	}

	// Inicializar Hub WebSocket
	hub := wsHandler.NewHub(dashboardService, time.Duration(cfg.UpdateInterval))
	go hub.Run()

	// Inicializar handler WebSocket
	handler := wsHandler.NewHandler(hub, dashboardService)

	// Configurar rutas
	mux := http.NewServeMux()
	mux.HandleFunc(cfg.WSPath, handler.ServeWS)
	mux.HandleFunc("/health", handler.HealthCheck)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(`
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Server - Panel de Control</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        .status { padding: 10px; background: #e7f3e7; border-left: 4px solid #4caf50; margin: 20px 0; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
        code { background: #333; color: #fff; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>🚀 WebSocket Server - Panel de Control de Estacionamiento</h1>
    <div class="status">
        <strong>Estado:</strong> ✅ Servidor activo
    </div>
    <h2>Endpoints disponibles:</h2>
    <div class="endpoint">
        <strong>WebSocket:</strong> <code>ws://localhost:` + cfg.WSPort + cfg.WSPath + `</code>
    </div>
    <div class="endpoint">
        <strong>Health Check:</strong> <code>http://localhost:` + cfg.WSPort + `/health</code>
    </div>
    <h2>Clientes conectados:</h2>
    <p id="clients">Cargando...</p>
    <script>
        fetch('/health')
            .then(r => r.json())
            .then(data => {
                document.getElementById('clients').textContent = data.clients + ' cliente(s) conectado(s)';
            });
    </script>
</body>
</html>
		`))
	})

	// Configurar servidor HTTP
	server := &http.Server{
		Addr:         ":" + cfg.WSPort,
		Handler:      corsMiddleware(mux, cfg.CORSOrigin),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Canal para señales de sistema
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Iniciar servidor en goroutine
	go func() {
		log.Printf("✅ Servidor WebSocket escuchando en http://localhost:%s", cfg.WSPort)
		log.Printf("📡 WebSocket endpoint: ws://localhost:%s%s", cfg.WSPort, cfg.WSPath)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Error al iniciar servidor: %v", err)
		}
	}()

	// Esperar señal de apagado
	<-stop
	log.Println("\n🛑 Señal de apagado recibida, cerrando servidor...")

	// Apagar el Hub
	hub.Shutdown()

	// Apagar servidor con timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Error al apagar servidor: %v", err)
	}

	log.Println("👋 Servidor cerrado correctamente")
}

// corsMiddleware agrega headers CORS con soporte para múltiples orígenes
func corsMiddleware(next http.Handler, defaultOrigin string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		
		// Lista de orígenes permitidos
		allowedOrigins := []string{
			"http://localhost:4200",
			"http://localhost:3000",
			"https://parking-frontend-g7vl.onrender.com",
		}
		
		// Verificar si el origen está permitido o es de onrender.com
		allowOrigin := defaultOrigin
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				allowOrigin = origin
				break
			}
		}
		// Permitir cualquier subdominio de onrender.com
		if strings.HasSuffix(origin, ".onrender.com") {
			allowOrigin = origin
		}
		
		w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
