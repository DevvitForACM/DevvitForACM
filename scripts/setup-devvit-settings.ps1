# Script to configure Devvit app settings from .env file
# Run this before using `npm run dev` (devvit playtest)

Write-Host "🔧 Setting up Devvit app settings..." -ForegroundColor Cyan

# Load .env file
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Parse .env and extract values
$env:FIREBASE_API_KEY = (Get-Content $envFile | Select-String "^FIREBASE_API_KEY=(.+)").Matches.Groups[1].Value
$env:REDDIT_CLIENT_ID = (Get-Content $envFile | Select-String "^REDDIT_CLIENT_ID=(.+)").Matches.Groups[1].Value
$env:REDDIT_CLIENT_SECRET = (Get-Content $envFile | Select-String "^REDDIT_CLIENT_SECRET=(.+)").Matches.Groups[1].Value
$env:JWT_SECRET = (Get-Content $envFile | Select-String "^JWT_SECRET=(.+)").Matches.Groups[1].Value

# Get private key (multiline) using a single-string regex (robust and avoids quoting issues)
$fileContent = Get-Content $envFile -Raw
$pkMatch = [regex]::Match($fileContent, '(?s)FIREBASE_PRIVATE_KEY="(.*?)"')
if ($pkMatch.Success) {
    $env:FIREBASE_PRIVATE_KEY = $pkMatch.Groups[1].Value
}

Write-Host "Setting firebaseApiKey..." -ForegroundColor Yellow
npx @devvit/cli settings set firebaseApiKey $env:FIREBASE_API_KEY

Write-Host "Setting redditClientId..." -ForegroundColor Yellow
npx @devvit/cli settings set redditClientId $env:REDDIT_CLIENT_ID

Write-Host "Setting redditClientSecret..." -ForegroundColor Yellow
npx @devvit/cli settings set redditClientSecret $env:REDDIT_CLIENT_SECRET

Write-Host "Setting jwtSecret..." -ForegroundColor Yellow
npx @devvit/cli settings set jwtSecret $env:JWT_SECRET

if ($env:FIREBASE_PRIVATE_KEY) {
    Write-Host "Setting firebasePrivateKey..." -ForegroundColor Yellow
    npx @devvit/cli settings set firebasePrivateKey $env:FIREBASE_PRIVATE_KEY
}

Write-Host "✅ Devvit settings configured!" -ForegroundColor Green
Write-Host "Now run: npm run dev" -ForegroundColor Cyan
