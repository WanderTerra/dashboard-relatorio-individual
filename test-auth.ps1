# Test Authentication System
# This script tests the login and authentication endpoints

Write-Host "=== TESTING AUTHENTICATION SYSTEM ===" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:8000"

# Test 1: Health check
Write-Host "1. Testing health check..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✓ Health check passed" -ForegroundColor Green
    Write-Host "   Database: $($healthResponse.database)" -ForegroundColor White
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure the backend server is running!" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Login with default admin user
Write-Host "2. Testing login with default admin user..." -ForegroundColor Blue

$loginData = @{
    username = "admin.sistema"
    password = "Temp@2025"
}

# Convert to form data format required by OAuth2PasswordRequestForm
$formData = @()
$formData += "username=$($loginData.username)"
$formData += "password=$($loginData.password)"
$body = $formData -join "&"

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/token" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "   Username: $($loginResponse.user.username)" -ForegroundColor White
    Write-Host "   Full Name: $($loginResponse.user.full_name)" -ForegroundColor White
    Write-Host "   Requires Password Change: $($loginResponse.user.requires_password_change)" -ForegroundColor White
    
    $token = $loginResponse.access_token
    Write-Host "   Token obtained successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host ""

# Test 3: Test protected endpoint
Write-Host "3. Testing protected endpoint..." -ForegroundColor Blue

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $protectedResponse = Invoke-RestMethod -Uri "$baseUrl/protected" -Method GET -Headers $headers
    Write-Host "✓ Protected endpoint access successful!" -ForegroundColor Green
    Write-Host "   Message: $($protectedResponse.message)" -ForegroundColor White
    Write-Host "   User: $($protectedResponse.user)" -ForegroundColor White
} catch {
    Write-Host "✗ Protected endpoint access failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 4: Test user info endpoint
Write-Host "4. Testing user info endpoint..." -ForegroundColor Blue

try {
    $userResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
    Write-Host "✓ User info endpoint successful!" -ForegroundColor Green
    Write-Host "   ID: $($userResponse.id)" -ForegroundColor White
    Write-Host "   Username: $($userResponse.username)" -ForegroundColor White
    Write-Host "   Full Name: $($userResponse.full_name)" -ForegroundColor White
    Write-Host "   Active: $($userResponse.active)" -ForegroundColor White
} catch {
    Write-Host "✗ User info endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== AUTHENTICATION TESTS COMPLETED ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check API documentation at http://localhost:8000/docs" -ForegroundColor White
Write-Host "2. Test password change functionality" -ForegroundColor White
Write-Host "3. Create additional users as needed" -ForegroundColor White
Write-Host "4. Implement frontend login integration" -ForegroundColor White
