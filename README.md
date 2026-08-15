# Control de Gastos — Login

Aplicación web con **backend** (Express + TypeScript) y **frontend** (Angular 18) para iniciar sesión como administrador. Por ahora funciona sin base de datos: el backend valida las credenciales de administrador de forma local.

## Credenciales

- **Correo:** `admin@controlgastos.com`
- **Contraseña:** `Admin123!`

## Estructura

```
backend/   Express + TypeScript (puerto 3100)
frontend/  Angular 18 (puerto 4300)
```

## Ejecución

```bash
# Backend (puerto 3100)
cd backend
pnpm install
pnpm dev

# Frontend (puerto 4300)
cd frontend
pnpm install
pnpm start
```

Al iniciar sesión con las credenciales correctas se muestra el mensaje **"Has iniciado sesión correctamente como administrador"** y un botón **Cerrar sesión**.