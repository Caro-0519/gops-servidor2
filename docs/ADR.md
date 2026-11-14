# Decisiones de arquitectura (ADR) de GOPS

Cada decisión sigue el formato: contexto, decisión, alternativas y consecuencias.

---

## ADR-001: Backend en Node.js 22 sin dependencias externas
- **Estado:** Aceptada (14 nov 2026)
- **Contexto:** Necesitábamos una API pequeña (sesión, guardado, respaldos, relé hacia la IA) que mantenga una sola persona y que tenga pocos puntos de falla.
- **Decisión:** Node.js 22 usando solo su librería estándar, incluido el módulo `node:sqlite`. El `package.json` del backend no tiene dependencias.
- **Alternativas:**
  1. Express con librerías adicionales (JWT, cifrado, SQLite).
  2. Python con FastAPI.
- **Consecuencias:**
  - Ventajas: imagen de Docker pequeña, nada que actualizar por vulnerabilidades de terceros y el mismo lenguaje (JavaScript) que el frontend.
  - Costos: hay que escribir a mano el enrutamiento, el token y el límite de intentos, y hay menos ejemplos listos.

---

## ADR-002: SQLite en un volumen de Docker
- **Estado:** Aceptada (14 nov 2026)
- **Contexto:** Un solo usuario y pocos registros. Se quería no administrar un servidor de base de datos y que los datos sobrevivan a reconstruir los contenedores.
- **Decisión:** SQLite (archivo `gops.db`) guardado en el volumen `gops-data`. Los datos se guardan como documento JSON por clave en la tabla `kv`, con copia diaria en `respaldos` (30 días).
- **Alternativas:**
  1. PostgreSQL en un contenedor propio.
  2. MySQL.
- **Consecuencias:**
  - Ventajas: un solo archivo, sin servicio adicional y respaldo sencillo.
  - Costos: un solo escritor a la vez. Si se abre a varias facultades habrá que migrar a una base de datos servidor y a un modelo con tablas.

---

## ADR-003: Auditor híbrido (reglas + IA)
- **Estado:** Aceptada (14 nov 2026)
- **Contexto:** Había que detectar inconsistencias en las OPS y explicarlas, sin que un error de la IA cambie datos de contratación.
- **Decisión:** Las reglas (en el frontend) detectan y calculan. La IA solo explica y ordena los hallazgos. Nunca modifica datos.
- **Alternativas:**
  1. Solo reglas, sin IA.
  2. Que la IA analice todos los registros y decida.
- **Consecuencias:**
  - Ventajas: resultado predecible y verificable, y la app funciona igual sin IA.
  - Costos: las reglas hay que mantenerlas a mano. Las explicaciones dependen del proveedor y de su disponibilidad.

---

## ADR-004: IA consumida desde el backend con patrón adaptador
- **Estado:** Aceptada (14 nov 2026)
- **Contexto:** El auditor necesita un modelo de IA, y su llave no debe quedar expuesta ni atar el proyecto a un solo proveedor.
- **Decisión:** El navegador llama a `/api/ia` y el backend reenvía la consulta al proveedor configurado (Gemini por defecto; Anthropic y OpenAI disponibles) con reintentos y modelo de respaldo. La llave está en `.env`.
- **Alternativas:**
  1. Llamar a Gemini directamente desde el navegador.
  2. Escribir el código para un único proveedor.
- **Consecuencias:**
  - Ventajas: la llave nunca llega al navegador y cambiar de proveedor es solo una variable de entorno.
  - Costos: más código en el backend y una pieza más que probar.

---

## ADR-005: Sesión con token JWT de 12 horas y usuario único
- **Estado:** Aceptada (14 nov 2026)
- **Contexto:** La aplicación la usa una sola persona (la Auxiliar administrativa) y no debía exigir un sistema de usuarios complejo.
- **Decisión:** Un usuario con contraseña cifrada (scrypt), token firmado (HMAC-SHA256) de 12 horas y bloqueo de 5 minutos tras 5 intentos fallidos.
- **Alternativas:**
  1. Sesiones guardadas en el servidor o en la base de datos.
  2. Inicio de sesión institucional (SSO).
- **Consecuencias:**
  - Ventajas: el backend se puede reiniciar sin cerrar sesiones y la implementación es simple.
  - Costos: no hay roles ni varios usuarios, y un token no se puede revocar antes de que venza.
