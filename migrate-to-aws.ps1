# AWS Migration Script - Replace Firebase with AWS DynamoDB
# This script updates all service files to use AWS instead of Firebase

Write-Host "Starting AWS Migration..." -ForegroundColor Green

$serviceFiles = @(
    "fineCheckerService.ts",
    "vehicleOwnerService.ts", 
    "parkingZoneService.ts",
    "parkingTicketService.ts",
    "mcOfficerService.ts"
)

$basePath = "d:\My Documets\SLT\AWs\parking-system-mobile-app-main\app\services"

foreach ($file in $serviceFiles) {
    $filePath = Join-Path $basePath $file
    
    if (Test-Path $filePath) {
        Write-Host "Processing $file..." -ForegroundColor Yellow
        
        # Read the file content
        $content = Get-Content $filePath -Raw
        
        # Replace Firebase imports
        $content = $content -replace 'import \{[^}]+\} from "firebase/firestore";', ''
        $content = $content -replace 'import \{ db \} from "./firebase";', 'import awsDynamoService from "./awsDynamoService";'
        
        # Replace common Firebase operations
        $content = $content -replace 'collection\(db,\s*"([^"]+)"\)', '"$1"'
        $content = $content -replace 'doc\(db,\s*"([^"]+)",\s*([^\)]+)\)', '"$1", $2'
        
        # Save the modified content
        Set-Content -Path $filePath -Value $content
        
        Write-Host "  ✓ Updated $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nMigration script completed!" -ForegroundColor Green
Write-Host "Note: Service files have been updated with AWS DynamoDB references." -ForegroundColor Cyan
Write-Host "You will need to manually review and update specific DynamoDB operations." -ForegroundColor Cyan
