# 🚀 AWS Installation & Setup Script
# Run this after completing AWS infrastructure setup

Write-Host "`n🎯 ParkMate AWS Installation Script" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Step 1: Clean old dependencies
Write-Host "📦 Step 1: Cleaning old dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "  ✓ Removed node_modules" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "  ✓ Removed package-lock.json" -ForegroundColor Green
}

# Step 2: Install dependencies
Write-Host "`n📥 Step 2: Installing dependencies..." -ForegroundColor Yellow
Write-Host "  This may take 2-3 minutes..." -ForegroundColor Gray
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n  ✓ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n  ✗ Installation failed!" -ForegroundColor Red
    Write-Host "  Try running: npm install --legacy-peer-deps" -ForegroundColor Yellow
    exit 1
}

# Step 3: Verify configuration
Write-Host "`n⚙️  Step 3: Verifying configuration..." -ForegroundColor Yellow

$appJsonPath = "app.json"
if (Test-Path $appJsonPath) {
    $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    $awsUrl = $appJson.expo.extra.AWS_API_GATEWAY_URL
    
    if ($awsUrl -and $awsUrl -ne "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod") {
        Write-Host "  ✓ AWS API Gateway URL configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  AWS API Gateway URL not configured!" -ForegroundColor Yellow
        Write-Host "     Update app.json with your AWS URLs" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ app.json not found!" -ForegroundColor Red
}

# Step 4: Summary
Write-Host "`n📋 Installation Complete!" -ForegroundColor Green
Write-Host "========================`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update app.json with your AWS configuration" -ForegroundColor White
Write-Host "2. Run: npm start" -ForegroundColor White
Write-Host "3. Open app in Expo Go or emulator" -ForegroundColor White
Write-Host "4. Test the app features`n" -ForegroundColor White

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  • AWS Setup: AWS_QUICK_START.md" -ForegroundColor White
Write-Host "  • Full Guide: AWS_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "  • Checklist: AWS_CHECKLIST.md" -ForegroundColor White

Write-Host "`n🎉 Happy coding!" -ForegroundColor Green
Write-Host ""
