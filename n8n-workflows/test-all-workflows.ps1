# ============================================
# TEST SCRIPTS PARA N8N WORKFLOWS
# Pilar 4: Event Bus
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   N8N WORKFLOW TESTS - Parking B2B   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))

# ============================================
# 1. TEST PARTNER HANDLER
# ============================================
Write-Host "`n[1] PARTNER HANDLER" -ForegroundColor Yellow
Write-Host "-------------------"

# Test parking.entered
Write-Host "  Testing parking.entered..." -ForegroundColor Gray
$body = @{plate="TEST-001"; spaceId="a1111111-1111-1111-1111-111111111111"} | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/partner-webhook" `
        -Method POST -ContentType "application/json" `
        -Headers @{"x-api-key"="waze-partner-001"; "x-signature"="test-sig"; "x-timestamp"=$timestamp; "x-webhook-event"="parking.entered"} `
        -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ parking.entered: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ parking.entered: $($_.Exception.Message)" -ForegroundColor Red
}

# Test parking.exited (necesita vehículo con ticket activo)
Write-Host "  Testing parking.exited..." -ForegroundColor Gray
$body = @{plate="ABC-123"; paymentMethod="Efectivo"} | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/partner-webhook" `
        -Method POST -ContentType "application/json" `
        -Headers @{"x-api-key"="waze-partner-001"; "x-signature"="test-sig"; "x-timestamp"=$timestamp; "x-webhook-event"="parking.exited"} `
        -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ parking.exited: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ parking.exited: $($_.Exception.Message)" -ForegroundColor Red
}

# Test parking.reserved
Write-Host "  Testing parking.reserved..." -ForegroundColor Gray
$body = @{plate="RES-001"; spaceId="a1111111-1111-1111-1111-111111111111"} | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/partner-webhook" `
        -Method POST -ContentType "application/json" `
        -Headers @{"x-api-key"="waze-partner-001"; "x-signature"="test-sig"; "x-timestamp"=$timestamp; "x-webhook-event"="parking.reserved"} `
        -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ parking.reserved: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ parking.reserved: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# 2. TEST PAYMENT HANDLER
# ============================================
Write-Host "`n[2] PAYMENT HANDLER" -ForegroundColor Yellow
Write-Host "-------------------"

# Test payment completed
Write-Host "  Testing payment.completed..." -ForegroundColor Gray
$body = @{
    paymentId = "pay_test_123"
    ticketId = "2b678924-9c9b-4d71-b29b-b77eaaa70805"
    amount = 15.50
    status = "completed"
    method = "card"
    customerEmail = "test@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/payment-webhook" `
        -Method POST -ContentType "application/json" `
        -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ payment.completed: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ payment.completed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test payment failed
Write-Host "  Testing payment.failed..." -ForegroundColor Gray
$body = @{
    paymentId = "pay_test_456"
    ticketId = "2b678924-9c9b-4d71-b29b-b77eaaa70805"
    amount = 10.00
    status = "failed"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/payment-webhook" `
        -Method POST -ContentType "application/json" `
        -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ payment.failed: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ payment.failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# 3. TEST MCP INPUT HANDLER
# ============================================
Write-Host "`n[3] MCP INPUT HANDLER" -ForegroundColor Yellow
Write-Host "---------------------"

# Test API channel
Write-Host "  Testing MCP API channel..." -ForegroundColor Gray
$body = @{
    message = "¿Cuántos espacios están disponibles?"
    channel = "api"
    user = @{ id = "user123" }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/mcp-input" `
        -Method POST -ContentType "application/json" `
        -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ MCP API: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ MCP API: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Telegram channel
Write-Host "  Testing MCP Telegram channel..." -ForegroundColor Gray
$body = @{
    channel = "telegram"
    message = @{
        text = "Consultar disponibilidad"
        from = @{ id = 123456; first_name = "Test"; username = "testuser" }
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/mcp-input" `
        -Method POST -ContentType "application/json" `
        -Headers @{ "x-channel" = "telegram" } `
        -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ MCP Telegram: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ MCP Telegram: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# RESUMEN
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TESTS COMPLETADOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nota: Los Scheduled Tasks se activan por cron," -ForegroundColor Gray
Write-Host "      no se pueden probar via webhook." -ForegroundColor Gray
Write-Host ""
Write-Host "Para importar workflows en n8n:" -ForegroundColor Yellow
Write-Host "  1. Abrir n8n: http://localhost:5678" -ForegroundColor White
Write-Host "  2. Ir a Settings > Import from File" -ForegroundColor White
Write-Host "  3. Seleccionar archivos de n8n-workflows/" -ForegroundColor White
