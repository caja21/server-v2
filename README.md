# Panel Casino21

Panel de gestión de caja para casino (cargas, retiros, cuentas, turnos, auditoría, notificaciones).

## Instalación en una PC servidor (red local)

Requisitos previos: instalar [Node.js LTS](https://nodejs.org) y [Git](https://git-scm.com/download/win).

```powershell
git clone https://github.com/caja21/server-v2.git casino-panel
cd casino-panel
.\install.ps1
```

El script `install.ps1` instala dependencias, crea la base de datos, carga datos de ejemplo, compila el proyecto y abre el puerto 3000 en el firewall.

## Iniciar el servidor

```powershell
.\start.ps1
```

Luego, desde cualquier PC de la red, abrir en el navegador:

```
http://IP-DE-LA-PC-SERVIDOR:3000
```

## Usuarios de ejemplo (cambiar la contraseña después del primer login)

- `admin` / `admin123` (rol ADMIN)
- `operador1` / `operador123` (rol OPERADOR)

## Mantener el servidor corriendo en segundo plano (opcional)

```powershell
npm install -g pm2
pm2 start npm --name casino-panel -- run start -- -- -H 0.0.0.0
pm2 save
pm2 startup
```

## Actualizar a la última versión

```powershell
git pull
npm install
npx prisma migrate deploy
npm run build
```
