/**
 * EJEMPLO DE INTEGRACIÓN - WebSocket Server en Go
 * 
 * Este archivo muestra cómo validar JWT localmente en el servidor WebSocket.
 * 
 * Agregar este middleware al WebSocket Server en Go para validar tokens
 * sin llamar al Auth Service en cada conexión.
 */

package middleware

/*
// jwt_validator.go

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims representa los claims del JWT
type JWTClaims struct {
	Sub   string `json:"sub"`   // User ID
	Email string `json:"email"` // Email
	Role  string `json:"role"`  // Role
	JTI   string `json:"jti"`   // JWT ID
	Type  string `json:"type"`  // Token type (access/refresh)
	jwt.RegisteredClaims
}

// JWTValidator valida tokens JWT localmente
type JWTValidator struct {
	secret       string
	secretMutex  sync.RWMutex
	authURL      string
	serviceKey   string
	refreshEvery time.Duration
}

// NewJWTValidator crea un nuevo validador
func NewJWTValidator(authURL, serviceKey string) *JWTValidator {
	v := &JWTValidator{
		authURL:      authURL,
		serviceKey:   serviceKey,
		refreshEvery: 24 * time.Hour,
	}
	
	// Obtener secreto inicial
	go v.fetchSecret()
	
	// Refrescar secreto periódicamente
	go func() {
		ticker := time.NewTicker(v.refreshEvery)
		for range ticker.C {
			v.fetchSecret()
		}
	}()
	
	return v
}

// fetchSecret obtiene el secreto del Auth Service
func (v *JWTValidator) fetchSecret() {
	client := &http.Client{Timeout: 10 * time.Second}
	
	req, err := http.NewRequest("GET", v.authURL+"/auth/validation-secret", nil)
	if err != nil {
		return
	}
	
	req.Header.Set("X-Service-Key", v.serviceKey)
	
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return
	}
	defer resp.Body.Close()
	
	var result struct {
		Secret    string `json:"secret"`
		Algorithm string `json:"algorithm"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return
	}
	
	v.secretMutex.Lock()
	v.secret = result.Secret
	v.secretMutex.Unlock()
}

// ValidateToken valida un token JWT localmente
func (v *JWTValidator) ValidateToken(tokenString string) (*JWTClaims, error) {
	v.secretMutex.RLock()
	secret := v.secret
	v.secretMutex.RUnlock()
	
	if secret == "" {
		return nil, errors.New("secret not configured")
	}
	
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	
	if err != nil {
		return nil, err
	}
	
	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	
	if claims.Type != "access" {
		return nil, errors.New("invalid token type")
	}
	
	return claims, nil
}

// Middleware HTTP para validación de JWT
func (v *JWTValidator) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		
		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := v.ValidateToken(token)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}
		
		// Agregar claims al contexto
		ctx := context.WithValue(r.Context(), "user", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// WebSocket upgrade con validación
func (v *JWTValidator) ValidateWebSocketUpgrade(r *http.Request) (*JWTClaims, error) {
	// Obtener token de query param o header
	token := r.URL.Query().Get("token")
	if token == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}
	
	if token == "" {
		return nil, errors.New("no token provided")
	}
	
	return v.ValidateToken(token)
}
*/
