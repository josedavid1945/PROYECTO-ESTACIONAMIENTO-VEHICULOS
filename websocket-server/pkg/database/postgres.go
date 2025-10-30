package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

// Connect establece conexión con PostgreSQL
func Connect(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("error al abrir conexión a la base de datos: %w", err)
	}

	// Configurar pool de conexiones
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Verificar conexión
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error al conectar a la base de datos: %w", err)
	}

	log.Println("✅ Conexión a PostgreSQL establecida correctamente")
	return db, nil
}

// Close cierra la conexión a la base de datos
func Close(db *sql.DB) error {
	if db != nil {
		log.Println("Cerrando conexión a la base de datos...")
		return db.Close()
	}
	return nil
}
