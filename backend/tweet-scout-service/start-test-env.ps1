# PowerShell script to start required services for tweet-scout-service testing

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Tweet Scout Service - Test Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root (2 levels up from this script)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)
Set-Location $projectRoot

Write-Host "📍 Project root: $projectRoot" -ForegroundColor White
Write-Host ""

# Start services
Write-Host "📦 Starting required services..." -ForegroundColor Yellow
Write-Host "   - Zookeeper" -ForegroundColor Gray
Write-Host "   - Kafka" -ForegroundColor Gray
Write-Host "   - PostgreSQL" -ForegroundColor Gray
Write-Host "   - Campaign Service" -ForegroundColor Gray
Write-Host ""

docker-compose up -d zookeeper kafka postgres campaign-service

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

# Wait for services
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Write-Host "   (This takes about 30-40 seconds)" -ForegroundColor Gray
Write-Host ""

for ($i = 30; $i -gt 0; $i--) {
    Write-Host "`r   ⏱️  $i seconds remaining..." -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 1
}
Write-Host ""
Write-Host ""

# Check service status
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
Write-Host ""
docker-compose ps zookeeper kafka postgres campaign-service
Write-Host ""

# Verify each service
Write-Host "🧪 Running verification tests..." -ForegroundColor Yellow
Write-Host ""

# Test Kafka
Write-Host "   Testing Kafka..." -NoNewline -ForegroundColor White
try {
    $null = docker exec atb-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  (may need more time)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ⚠️  (may need more time)" -ForegroundColor Yellow
}

# Test PostgreSQL
Write-Host "   Testing PostgreSQL..." -NoNewline -ForegroundColor White
try {
    $result = docker exec atb-postgres pg_isready -U postgres 2>$null
    if ($result -like "*accepting connections*") {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  (may need more time)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ⚠️  (may need more time)" -ForegroundColor Yellow
}

# Test Campaign Service
Write-Host "   Testing Campaign Service..." -NoNewline -ForegroundColor White
Start-Sleep -Seconds 5  # Give it extra time
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/api/campaigns" -Method Get -TimeoutSec 5
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ⚠️  (starting up, try again in 10 seconds)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Services are starting up!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Display service URLs
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   Kafka:            localhost:9092" -ForegroundColor White
Write-Host "   PostgreSQL:       localhost:5432" -ForegroundColor White
Write-Host "   Campaign Service: http://localhost:8082" -ForegroundColor White
Write-Host ""

# Display Kafka topics command
Write-Host "🔍 Useful Commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   List Kafka topics:" -ForegroundColor White
Write-Host "   docker exec atb-kafka kafka-topics --list --bootstrap-server localhost:9092" -ForegroundColor Gray
Write-Host ""
Write-Host "   View Kafka messages:" -ForegroundColor White
Write-Host "   docker exec atb-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic new_tweets --from-beginning" -ForegroundColor Gray
Write-Host ""
Write-Host "   View logs:" -ForegroundColor White
Write-Host "   docker-compose logs -f campaign-service" -ForegroundColor Gray
Write-Host ""
Write-Host "   Stop services:" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host ""

# Create test campaign
Write-Host "🎯 Creating a test campaign..." -ForegroundColor Yellow
Start-Sleep -Seconds 5  # Give campaign service more time

try {
    $campaignData = @{
        name = "Test Campaign - $(Get-Date -Format 'HH:mm:ss')"
        status = "ACTIVE"
        mode = "SEMI_AUTO"
        hashtags = @("#handmade", "#jewelry", "#gift")
        keywords = @("artisan", "handcrafted")
        searchMode = "LATEST"
        minFollowerCount = 100
        recentWindowMinutes = 15
        dailyLimit = 10
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "http://localhost:8082/api/campaigns" -Method Post -Body $campaignData -Headers $headers -TimeoutSec 10
    Write-Host "   ✅ Created test campaign: $($response.name)" -ForegroundColor Green
    Write-Host "   📍 Campaign ID: $($response.id)" -ForegroundColor White
} catch {
    Write-Host "   ⚠️  Could not create test campaign (service still starting)" -ForegroundColor Yellow
    Write-Host "   💡 You can create one manually later" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 Ready to test tweet-scout-service!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Show next steps
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open a new terminal and run:" -ForegroundColor White
Write-Host "   cd backend\tweet-scout-service" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Check the logs for:" -ForegroundColor White
Write-Host "   ✅ Kafka connection" -ForegroundColor Gray
Write-Host "   ✅ Campaign fetched" -ForegroundColor Gray
Write-Host "   ✅ Tweets published" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Monitor Kafka messages in another terminal:" -ForegroundColor White
Write-Host "   docker exec atb-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic new_tweets --from-beginning" -ForegroundColor Yellow
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - TESTING.md              (comprehensive testing guide)" -ForegroundColor Gray
Write-Host "   - START_DEPENDENCIES.md   (this guide)" -ForegroundColor Gray
Write-Host "   - QUICK_START.md          (quick start guide)" -ForegroundColor Gray
Write-Host ""

Write-Host "Press any key to exit..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

