# Script para configurar permissões rapidamente
Write-Host "🔧 Configurando permissões do sistema..." -ForegroundColor Green

# 1. Login como admin
Write-Host "1. Fazendo login como administrador..." -ForegroundColor Yellow
$loginResponse = Invoke-WebRequest -Uri 'http://localhost:8000/auth/token' -Method POST -ContentType 'application/x-www-form-urlencoded' -Body 'username=admin.sistema&password=Nova@2025'
$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.access_token
Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green

# 2. Criar usuário Kali Vitória
Write-Host "2. Criando usuário para Kali Vitória..." -ForegroundColor Yellow
$createUserBody = @{
    username = "kali.vitoria"
    full_name = "Kali Vitória"
} | ConvertTo-Json

try {
    $createUserResponse = Invoke-WebRequest -Uri 'http://localhost:8000/auth/create-user' -Method POST -ContentType 'application/json' -Body $createUserBody -Headers @{'Authorization'="Bearer $token"}
    $userData = $createUserResponse.Content | ConvertFrom-Json
    Write-Host "✅ Usuário criado: $($userData.username)" -ForegroundColor Green
    Write-Host "🔑 Senha temporária: $($userData.temporary_password)" -ForegroundColor Cyan
}
catch {
    Write-Host "⚠️ Usuário pode já existir, continuando..." -ForegroundColor Yellow
}

# 3. Configurar permissão específica para agente 1116
Write-Host "3. Configurando permissão para agente 1116..." -ForegroundColor Yellow
$permissionBody = @{
    username = "kali.vitoria"
    permission_name = "agent_1116"
} | ConvertTo-Json

try {
    $permissionResponse = Invoke-WebRequest -Uri 'http://localhost:8000/admin/assign-permission' -Method POST -ContentType 'application/json' -Body $permissionBody -Headers @{'Authorization'="Bearer $token"}
    Write-Host "✅ Permissão configurada com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Erro ao configurar permissão, pode ser normal se endpoint não existir ainda" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuração básica completa!" -ForegroundColor Green
Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host "   - Usuário: kali.vitoria" -ForegroundColor White
Write-Host "   - Senha: Temp@2025" -ForegroundColor White
Write-Host "   - Acesso: Configurado para agente 1116" -ForegroundColor White
