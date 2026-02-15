# Docker Verification Script
# Builds the image and tests if Puppeteer can launch inside it

Write-Host "🐳 Building Docker Image..." -ForegroundColor Cyan
docker build -t pdftoolkit .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed!"
    exit 1
}

Write-Host "🚀 Verify Puppeteer Launch..." -ForegroundColor Cyan
# runs a one-liner inside the container to verify pupeteer can find chromium and launch
docker run --rm pdftoolkit node -e "const p = require('puppeteer'); (async () => { try { const b = await p.launch({args: ['--no-sandbox']}); console.log('✅ Puppeteer Launched Successfully!'); await b.close(); } catch(e) { console.error('❌ Failed:', e); process.exit(1); } })();"

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Success! The container is ready for Oracle Cloud." -ForegroundColor Green
} else {
    Write-Error "💥 Puppeteer crashed inside the container. Check libraries."
}
