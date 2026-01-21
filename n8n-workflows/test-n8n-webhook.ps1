# =====================================================
# SCRIPT DE PRUEBA - Partner Handler n8n
# =====================================================
# Ejecutar: powershell -ExecutionPolicy Bypass -File test-n8n-webhook.ps1
# =====================================================

Write-Host "========================================"
Write-Host "🧪 TEST - Partner Handler n8n"
Write-Host "========================================"

# Configuración
$N8N_WEBHOOK_URL = "http://localhost:5678/webhook/partner-webhook"
$API_KEY = "pk_test_example123"
$API_SECRET = "sk_test_secret456"

# Generar datos de autenticación
$timestamp = [Math]::Floor([decimal](Get-Date -UFormat %s))
$nonce = [Guid]::NewGuid().ToString().Replace("-", "").Substring(0, 32)

# Payload de prueba
$payload = @{
    reservationId = "RES-" + (Get-Random -Maximum 99999)
    vehiclePlate = "ABC-" + (Get-Random -Maximum 999)
    guestName = "John Doe"
    checkIn = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    spaces = 1
    zone = "A"
} | ConvertTo-Json

# Crear firma HMAC (simplificada para demo)
$messageToSign = "$timestamp.$nonce.$payload"
$hmacsha256 = New-Object System.Security.Cryptography.HMACSHA256
$hmacsha256.Key = [System.Text.Encoding]::UTF8.GetBytes($API_SECRET)
$signatureBytes = $hmacsha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($messageToSign))
$signature = "sha256=" + [System.BitConverter]::ToString($signatureBytes).Replace("-", "").ToLower()

Write-Host ""
Write-Host "📋 Datos del Request:"
Write-Host "  - URL: $N8N_WEBHOOK_URL"
Write-Host "  - Event: parking.reserved"
Write-Host "  - Timestamp: $timestamp"
Write-Host "  - Nonce: $nonce"
Write-Host ""
Write-Host "📦 Payload:"
Write-Host $payload
Write-Host ""

# Hacer el request
Write-Host "🚀 Enviando webhook..."
Write-Host ""

try {
    $headers = @{
        "Content-Type" = "application/json"
        "X-API-Key" = $API_KEY
        "X-Signature" = $signature
        "X-Timestamp" = $timestamp
        "X-Nonce" = $nonce
        "X-Webhook-Event" = "parking.reserved"
    }
    
    $response = Invoke-RestMethod -Uri $N8N_WEBHOOK_URL -Method POST -Headers $headers -Body $payload
    
    Write-Host "✅ ÉXITO - Respuesta de n8n:"
    Write-Host ($response | ConvertTo-Json -Depth 5)
}
catch {
    Write-Host "❌ ERROR:"
    Write-Host $_.Exception.Message
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "🏁 Test completado"
Write-Host "========================================"
