# Backend Setup and Test Script
# This script will install dependencies and test the authentication system

Write-Host "=== BACKEND AUTHENTICATION SETUP ===" -ForegroundColor Green
Write-Host ""

# Check if we're in the correct directory
$backendPath = ".\backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "ERROR: Backend directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Change to backend directory
Set-Location $backendPath

Write-Host "1. Installing Python dependencies..." -ForegroundColor Blue
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "2. Starting backend server..." -ForegroundColor Blue
Write-Host "The server will start on http://localhost:8000" -ForegroundColor Yellow
Write-Host "API documentation will be available at http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Default admin user will be created:" -ForegroundColor Cyan
Write-Host "  Username: admin.sistema" -ForegroundColor White
Write-Host "  Password: Temp@2025" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the backend server
python start.py
