# Script para configurar permissões rapidamente
# PowerShell script para criar usuário Kali Vitória e configurar permissões

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
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "⚠️ Usuário já existe, continuando..." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Erro ao criar usuário: $_" -ForegroundColor Red
        exit 1
    }
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
} catch {
    Write-Host "⚠️ Erro ao configurar permissão: $_" -ForegroundColor Yellow
}

# 4. Testar login do novo usuário
Write-Host "4. Testando login do novo usuário..." -ForegroundColor Yellow
try {
    $testLoginResponse = Invoke-WebRequest -Uri 'http://localhost:8000/auth/token' -Method POST -ContentType 'application/x-www-form-urlencoded' -Body 'username=kali.vitoria&password=Temp@2025'
    $testLoginData = $testLoginResponse.Content | ConvertFrom-Json
    $userToken = $testLoginData.access_token
    Write-Host "✅ Login do usuário testado com sucesso!" -ForegroundColor Green
    
    # 5. Testar acesso ao agente permitido (1116)
    Write-Host "5. Testando acesso ao agente 1116 (permitido)..." -ForegroundColor Yellow
    try {
        $agentResponse = Invoke-WebRequest -Uri 'http://localhost:8000/agent/1116/summary?start=2024-01-01&end=2024-12-31' -Method GET -Headers @{'Authorization'="Bearer $userToken"}
        Write-Host "✅ Acesso ao agente 1116 PERMITIDO!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao acessar agente 1116: $_" -ForegroundColor Red
    }
    
    # 6. Testar acesso a agente não permitido (1119)
    Write-Host "6. Testando acesso ao agente 1119 (negado)..." -ForegroundColor Yellow
    try {
        $deniedResponse = Invoke-WebRequest -Uri 'http://localhost:8000/agent/1119/summary?start=2024-01-01&end=2024-12-31' -Method GET -Headers @{'Authorization'="Bearer $userToken"}
        Write-Host "⚠️ ATENÇÃO: Acesso ao agente 1119 foi PERMITIDO (deveria ser negado)" -ForegroundColor Red
    } catch {
        Write-Host "✅ Acesso ao agente 1119 foi NEGADO corretamente!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Erro no login do usuário: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Configuração completa!" -ForegroundColor Green
Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host "   - Usuário: kali.vitoria" -ForegroundColor White
Write-Host "   - Senha: Temp@2025" -ForegroundColor White
Write-Host "   - Acesso: Apenas agente 1116" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Para testar manualmente:" -ForegroundColor Yellow
Write-Host "   Login: POST http://localhost:8000/auth/token" -ForegroundColor Gray
Write-Host "   Body: username=kali.vitoria`&password=Temp@2025" -ForegroundColor Gray
