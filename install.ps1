# Instalacion del servidor Panel Casino21
# Ejecutar en PowerShell (no como administrador es suficiente, salvo el firewall)

Write-Host "== 1. Verificando Node.js ==" -ForegroundColor Cyan
node -v
if (-not $?) {
    Write-Host "Node.js no esta instalado. Descargalo de https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "== 2. Instalando dependencias ==" -ForegroundColor Cyan
npm install

Write-Host "== 3. Configurando variables de entorno ==" -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Archivo .env creado a partir de .env.example" -ForegroundColor Yellow
} else {
    Write-Host ".env ya existe, no se sobreescribe" -ForegroundColor Yellow
}

Write-Host "== 4. Creando base de datos ==" -ForegroundColor Cyan
npx prisma migrate deploy

Write-Host "== 5. Cargando datos iniciales (admin/operador de ejemplo) ==" -ForegroundColor Cyan
npm run seed

Write-Host "== 6. Compilando build de produccion ==" -ForegroundColor Cyan
npm run build

Write-Host "== 7. Abriendo puerto 3000 en el firewall ==" -ForegroundColor Cyan
$rule = Get-NetFirewallRule -DisplayName "CasinoPanel" -ErrorAction SilentlyContinue
if (-not $rule) {
    try {
        New-NetFirewallRule -DisplayName "CasinoPanel" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction Stop | Out-Null
        Write-Host "Regla de firewall creada" -ForegroundColor Green
    } catch {
        Write-Host "No se pudo crear la regla de firewall (ejecuta como Administrador si queres acceso desde otras PCs)" -ForegroundColor Yellow
    }
} else {
    Write-Host "Regla de firewall ya existe" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "== Instalacion completa ==" -ForegroundColor Green
Write-Host "Para iniciar el servidor ejecuta: .\start.ps1" -ForegroundColor Green
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
Write-Host "Luego accede desde otras PCs en: http://$ip`:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Usuarios de ejemplo: admin/admin123 - operador1/operador123" -ForegroundColor Yellow
Write-Host "IMPORTANTE: cambia estas contrasenias despues del primer inicio de sesion." -ForegroundColor Yellow
