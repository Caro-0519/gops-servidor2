# ADR-001: JavaScript como stack único (Node.js en el backend, React en el frontend)

- **Estado:** Aceptada (14 nov 2026)

## Contexto
GOPS reemplaza un Excel de control de OPS y bonificaciones de posgrados. Lo desarrolla y mantiene una sola persona, necesita una interfaz web con tablas y formularios, y una API pequeña (sesión, guardado, respaldos y relé hacia la IA) con pocos puntos de falla.

## Decisión
Usar JavaScript en todo el proyecto:
- **Frontend:** React 18, compilado con esbuild y servido con nginx.
- **Backend:** Node.js 22 usando solo su librería estándar (sin dependencias externas).

## Alternativas
1. Python con FastAPI en el backend y React en el frontend.
2. Express (Node.js) con librerías adicionales para token, cifrado y base de datos.

## Consecuencias
- **Ventajas:** un solo lenguaje para todo el proyecto, imagen de Docker pequeña, nada que actualizar por vulnerabilidades de terceros en el backend y mucho material de apoyo para React.
- **Costos:** el enrutamiento, el token y el límite de intentos hay que escribirlos a mano, y el frontend compilado debe regenerarse y subirse cuando cambia el código.
