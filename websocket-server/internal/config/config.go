package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config contiene toda la configuración de la aplicación
type Config struct {
	Mode           string // "rest" o "database"
	RestAPIURL     string
	DatabaseURL    string
	WSPort         string
	WSPath         string
	CORSOrigin     string
	UpdateInterval int // segundos entre actualizaciones automáticas
}

// Load carga la configuración desde variables de entorno
func Load() *Config {
	// Cargar archivo .env si existe
	if err := godotenv.Load(); err != nil {
		log.Println("No se encontró archivo .env, usando variables de entorno del sistema")
	}

	updateInterval, err := strconv.Atoi(getEnv("UPDATE_INTERVAL", "5"))
	if err != nil {
		updateInterval = 5
	}

	return &Config{
		Mode:           getEnv("MODE", "rest"),
		RestAPIURL:     getEnv("REST_API_URL", "http://localhost:3000"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		WSPort:         getEnv("WS_PORT", "8080"),
		WSPath:         getEnv("WS_PATH", "/ws"),
		CORSOrigin:     getEnv("CORS_ORIGIN", "*"),
		UpdateInterval: updateInterval,
	}
}

// getEnv obtiene una variable de entorno o devuelve un valor por defecto
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// Validate valida que la configuración sea correcta
func (c *Config) Validate() error {
	// Validar según el modo
	if c.Mode == "database" && c.DatabaseURL == "" {
		log.Fatal("DATABASE_URL es requerido cuando MODE=database")
	}
	if c.Mode == "rest" && c.RestAPIURL == "" {
		log.Fatal("REST_API_URL es requerido cuando MODE=rest")
	}
	return nil
}
