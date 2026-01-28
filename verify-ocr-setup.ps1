# OCR Setup Verification Script
# Run this to check if your OCR setup is correct

Write-Host "`n🔍 Checking OCR Setup..." -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check 1: .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check 2: Gemini API key in .env
    $apiKey = (Get-Content .env | Select-String "EXPO_PUBLIC_GEMINI_API_KEY").Line
    if ($apiKey -and $apiKey -match 'AIzaSy') {
        Write-Host "✅ Gemini API key found in .env" -ForegroundColor Green
        $keyPreview = $apiKey.Substring(0, [Math]::Min(40, $apiKey.Length)) + "..."
        Write-Host "   $keyPreview" -ForegroundColor Gray
    } else {
        Write-Host "❌ Gemini API key NOT found in .env" -ForegroundColor Red
        Write-Host "   👉 Add: EXPO_PUBLIC_GEMINI_API_KEY=your_key" -ForegroundColor Yellow
        Write-Host "   👉 Get key from: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file NOT found" -ForegroundColor Red
    Write-Host "   👉 Create .env file in project root" -ForegroundColor Yellow
    Write-Host "   👉 Add: EXPO_PUBLIC_GEMINI_API_KEY=your_key" -ForegroundColor Yellow
}

Write-Host ""

# Check 3: Required packages
Write-Host "📦 Checking required packages..." -ForegroundColor Cyan

$packages = @(
    "@google/generative-ai",
    "expo-file-system",
    "expo-image-manipulator",
    "expo-camera"
)

foreach ($pkg in $packages) {
    $check = npm list $pkg 2>&1
    if ($check -match $pkg) {
        Write-Host "✅ $pkg installed" -ForegroundColor Green
    } else {
        Write-Host "❌ $pkg NOT installed" -ForegroundColor Red
        Write-Host "   👉 Run: npm install $pkg" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check 4: OCR service file
if (Test-Path "app/services/ocrService.ts") {
    Write-Host "✅ OCR service file exists" -ForegroundColor Green
} else {
    Write-Host "❌ OCR service file NOT found" -ForegroundColor Red
}

Write-Host ""

# Check 5: Scan plate screens
$scanScreens = @(
    "app/screens/parkingOwner/dashboard/scanPlate.tsx",
    "app/screens/parkingInspector/inspectorScanPlate.tsx"
)

$foundScreens = 0
foreach ($screen in $scanScreens) {
    if (Test-Path $screen) {
        $foundScreens++
    }
}

if ($foundScreens -gt 0) {
    Write-Host "✅ Found $foundScreens scan plate screen(s)" -ForegroundColor Green
} else {
    Write-Host "⚠️  No scan plate screens found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Final verdict
$apiKeyOk = (Test-Path ".env") -and ((Get-Content .env -ErrorAction SilentlyContinue | Select-String "EXPO_PUBLIC_GEMINI_API_KEY") -match 'AIzaSy')
$packagesOk = (npm list "@google/generative-ai" 2>&1) -match "@google/generative-ai"
$serviceOk = Test-Path "app/services/ocrService.ts"

if ($apiKeyOk -and $packagesOk -and $serviceOk) {
    Write-Host "🎉 OCR Setup is READY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart Expo: npx expo start --clear" -ForegroundColor White
    Write-Host "2. Open app and test license plate scanning" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  OCR Setup needs attention" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick fixes:" -ForegroundColor Cyan
    if (-not $apiKeyOk) {
        Write-Host "• Add Gemini API key to .env file" -ForegroundColor White
        Write-Host "  Get it from: https://aistudio.google.com/app/apikey" -ForegroundColor Gray
    }
    if (-not $packagesOk) {
        Write-Host "• Install packages: npm install" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "See SETUP_OCR_IN_3_STEPS.md for detailed guide" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "For help see QUICK_OCR_TROUBLESHOOTING.md" -ForegroundColor Gray
Write-Host ""
