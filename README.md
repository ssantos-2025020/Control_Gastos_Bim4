# Control de Gastos — Login

Aplicación web con **backend** (Express + TypeScript) y **frontend** (Angular 18) para iniciar sesión como administrador. Las credenciales se validan contra **PostgreSQL** (tabla `usuarios`) usando el driver `pg` y contraseñas encriptadas con bcrypt.

## Credenciales

- **Correo:** `admin@controlgastos.com`
- **Contraseña:** `Admin123!`

## Estructura

```
backend/   Express + TypeScript + PostgreSQL (puerto 3100)
frontend/  Angular 18 (puerto 4200)
```

## Ejecución

```bash
# Backend (puerto 3100)
cd backend
pnpm install
pnpm dev

# Frontend (puerto 4200)
cd frontend
pnpm install
pnpm start
```

## Configuración (backend/.env)

El backend requiere las siguientes variables en `backend/.env`:

```
PORT=3100
DATABASE_URL="postgresql://postgres:admin@localhost:5432/control_gastos?schema=public"
JWT_SECRET="..."
JWT_EXPIRES_IN="3h"
ADMIN_EMAIL="admin@controlgastos.com"
ADMIN_PASSWORD="Admin123!"
ADMIN_NOMBRE="Administrador"
```

La sesión expira según `JWT_EXPIRES_IN`. Antes de que caduque, el frontend muestra un aviso para extenderla; si no se responde, cierra la sesión automáticamente.