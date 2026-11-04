# API de GOPS

Todas las rutas cuelgan de `/api` (en el servidor de la universidad: `https://lidis.usbcali.edu.co/gops/api/…`). El cuerpo y las respuestas son JSON. Las rutas protegidas exigen el encabezado `Authorization: Bearer <token>`.

Las respuestas de esta página son **reales**: se obtuvieron ejecutando el servidor (ver `docs/openapi.yaml` para la especificación formal). Los tokens se muestran recortados y la respuesta de la IA proviene de un proveedor simulado, solo para la evidencia.

## Resumen de rutas

| Método | Ruta | Requiere sesión | Qué hace | Códigos |
| --- | --- | --- | --- | --- |
| GET | `/api/salud` | No | Comprueba que el servicio responde | 200 |
| GET | `/api/estado` | No | Indica si ya existe la cuenta de acceso | 200 |
| POST | `/api/configurar` | No | Crea la cuenta (solo la primera vez) | 200, 400, 409 |
| POST | `/api/login` | No | Inicia sesión y entrega un token de 12 h | 200, 401, 429 |
| POST | `/api/cambiar-clave` | Sí | Cambia la contraseña | 200, 400, 401 |
| GET | `/api/storage?prefix=` | Sí | Lista las claves guardadas | 200, 401 |
| GET | `/api/storage/{clave}` | Sí | Lee un dato guardado | 200, 401, 404 |
| PUT | `/api/storage/{clave}` | Sí | Crea o actualiza un dato (con copia diaria) | 200, 400, 401 |
| DELETE | `/api/storage/{clave}` | Sí | Borra un dato | 200, 401 |
| GET | `/api/respaldo` | Sí | Descarga todo en un archivo JSON | 200, 401 |
| GET | `/api/ia/estado` | Sí | Proveedor y modelo de IA configurados | 200, 401 |
| GET | `/api/ia/probar` | Sí | Prueba la conexión con la IA | 200, 401 |
| POST | `/api/ia` | Sí | Envía una consulta a la IA (formato común) | 200, 400, 401, 501, 502 (y 429/503 si el proveedor sigue saturado tras 4 intentos) |

## Ejemplos reales

### 1. Salud del servicio

`GET /api/salud` · Autenticación: —

Respuesta **200**:
```json
{
  "ok": true
}
```

### 2. ¿Hay cuenta creada?

`GET /api/estado` · Autenticación: —

Respuesta **200**:
```json
{
  "hayUsuario": false
}
```

### 3. Crear cuenta con contraseña corta (validación)

`POST /api/configurar` · Autenticación: —

Solicitud:
```json
{
  "usuario": "carolina",
  "clave": "corta"
}
```

Respuesta **400**:
```json
{
  "error": "La contraseña debe tener al menos 8 caracteres."
}
```

### 4. Crear cuenta

`POST /api/configurar` · Autenticación: —

Solicitud:
```json
{
  "usuario": "carolina",
  "clave": "Clave-Segura-1"
}
```

Respuesta **200**:
```json
{
  "token": "eyJhbGciOiJIUzI1Ni…(token firmado)",
  "horas": 12
}
```

### 5. Crear cuenta otra vez (ya existe)

`POST /api/configurar` · Autenticación: —

Solicitud:
```json
{
  "usuario": "otra",
  "clave": "Clave-Segura-2"
}
```

Respuesta **409**:
```json
{
  "error": "Ya hay una cuenta configurada."
}
```

### 6. Iniciar sesión con contraseña incorrecta

`POST /api/login` · Autenticación: —

Solicitud:
```json
{
  "usuario": "carolina",
  "clave": "mala"
}
```

Respuesta **401**:
```json
{
  "error": "Usuario o contraseña incorrectos."
}
```

### 7. Iniciar sesión

`POST /api/login` · Autenticación: —

Solicitud:
```json
{
  "usuario": "carolina",
  "clave": "Clave-Segura-1"
}
```

Respuesta **200**:
```json
{
  "token": "eyJhbGciOiJIUzI1Ni…(token firmado)",
  "horas": 12
}
```

### 8. Leer datos sin token

`GET /api/storage/ops-app-state-v1` · Autenticación: —

Respuesta **401**:
```json
{
  "error": "Sesión no válida o vencida."
}
```

### 9. Leer datos antes de guardar nada

`GET /api/storage/ops-app-state-v1` · Autenticación: Bearer <token>

Respuesta **404**:
```json
{
  "error": "No existe."
}
```

### 10. Guardar el estado (crear/actualizar la OPS)

`PUT /api/storage/ops-app-state-v1` · Autenticación: Bearer <token>

Solicitud:
```json
{
  "value": "{\"records\":[{\"id\":\"r-demo-1\",\"_v\":1793800000000,\"tipo\":\"OPS\",\"noOPS\":\"OPS-2026-000123\",\"programa\":\"MISW\",\"cohorte\":\"5\",\"modulo\":\"Arquitectura de software\",\"docente\":\"Docente de Ejemplo\",\"horas\":32,\"valorHora\":137000,\"fechaInicio\":\"2026-09-14\",\"fechaFin\":\"2026-10-25\",\"estado\":\"OPS Solicitada\"}],\"borrados\":[],\"config\":{\"usuarioActual\":\"carolina\"}}"
}
```

Respuesta **200**:
```json
{
  "key": "ops-app-state-v1"
}
```

### 11. Guardar sin el campo value (validación)

`PUT /api/storage/ops-app-state-v1` · Autenticación: Bearer <token>

Respuesta **400**:
```json
{
  "error": "Falta el valor."
}
```

### 12. Leer el estado guardado

`GET /api/storage/ops-app-state-v1` · Autenticación: Bearer <token>

Respuesta **200**:
```json
{
  "key": "ops-app-state-v1",
  "value": "{\"records\":[{\"id\":\"r-demo-1\",\"_v\":1793800000000,\"tipo\":\"OPS\",\"noOPS\":\"OPS-2026-000123\",\"programa\":\"MISW\",\"cohorte\":\"5\",\"modulo\":\"Arquitectura de software\",\"docente\":\"Docente de Ejemplo\",\"horas\":32,\"valorHora\":137000,\"fechaInicio\":\"2026-09-14\",\"fechaFin\":\"2026-10-25\",\"estado\":\"OPS Solicitada\"}],\"borrados\":[],\"config\":{\"usuarioActual\":\"carolina\"}}"
}
```

### 13. Listar claves guardadas

`GET /api/storage?prefix=ops` · Autenticación: Bearer <token>

Respuesta **200**:
```json
{
  "keys": [
    "ops-app-state-v1"
  ],
  "prefix": "ops"
}
```

### 14. Estado de la IA

`GET /api/ia/estado` · Autenticación: Bearer <token>

Respuesta **200**:
```json
{
  "activa": true,
  "proveedor": "gemini",
  "modelo": "gemini-3.7-flash"
}
```

### 15. Consulta a la IA (auditor)

`POST /api/ia` · Autenticación: Bearer <token>

Solicitud:
```json
{
  "max_tokens": 300,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Explica en una frase este hallazgo: valor distinto a la tarifa vigente."
        }
      ]
    }
  ]
}
```

Respuesta **200**:
```json
{
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hallazgo explicado (respuesta simulada de Gemini para la evidencia)."
    }
  ]
}
```

### 16. Consulta a la IA con cuerpo inválido

`POST /api/ia` · Autenticación: Bearer <token>

Respuesta **400**:
```json
{
  "error": {
    "message": "Solicitud inválida."
  }
}
```

### 17. Descargar respaldo completo

`GET /api/respaldo` · Autenticación: Bearer <token>

Respuesta **200**:
```json
{
  "app": "GOPS",
  "fecha": "2026-11-04T13:57:54.027Z",
  "kv": {
    "ops-app-state-v1": "{\"records\":[{\"id\":\"r-demo-1\",\"_v\":1793800000000,\"tipo\":\"OPS\",\"noOPS\":\"OPS-2026-000123\",\"programa\":\"MISW\",\"cohorte\":\"5\",\"modulo\":\"Arquitectura de software\",\"docente\":\"Docente de Ejemplo\",\"horas\":32,\"valorHora\":137000,\"fechaInicio\":\"2026-09-14\",\"fechaFin\":\"2026-10-25\",\"estado\":\"OPS Solicitada\"}],\"borrados\":[],\"config\":{\"usuarioActual\":\"carolina\"}}"
  }
}
```

### 18. Leer el estado después de REINICIAR el servidor (persistencia)

`GET /api/storage/ops-app-state-v1` · Autenticación: Bearer <token>

Respuesta **200**:
```json
{
  "key": "ops-app-state-v1",
  "value": "{\"records\":[{\"id\":\"r-demo-1\",\"_v\":1793800000000,\"tipo\":\"OPS\",\"noOPS\":\"OPS-2026-000123\",\"programa\":\"MISW\",\"cohorte\":\"5\",\"modulo\":\"Arquitectura de software\",\"docente\":\"Docente de Ejemplo\",\"horas\":32,\"valorHora\":137000,\"fechaInicio\":\"2026-09-14\",\"fechaFin\":\"2026-10-25\",\"estado\":\"OPS Solicitada\"}],\"borrados\":[],\"config\":{\"usuarioActual\":\"carolina\"}}"
}
```

### 19. Borrar la clave

`DELETE /api/storage/ops-app-state-v1` · Autenticación: Bearer <token>

Respuesta **200**:
```json
{
  "key": "ops-app-state-v1",
  "deleted": true
}
```

### 20. Ruta inexistente

`GET /api/no-existe` · Autenticación: Bearer <token>

Respuesta **404**:
```json
{
  "error": "Ruta no encontrada."
}
```

## Modelo de datos

El servidor guarda cada dato como un documento JSON bajo una clave (la app usa `ops-app-state-v1`). Tablas SQLite:

| Tabla | Contenido |
| --- | --- |
| `kv` | `key` (PK), `value` (JSON como texto), `updated_at` |
| `respaldos` | Copia diaria del valor anterior: `dia`, `key`, `value`; se conservan 30 días |
| `usuario` | Un único usuario: `nombre` y `hash` (scrypt con sal) |
| `meta` | Valores internos, como el secreto de firma de los tokens |

Dentro de `ops-app-state-v1` el campo `records` contiene los registros de OPS y bonificaciones (docente, programa, módulo, horas, valor hora, fechas, estado, documentos, `_v` = marca de versión para fusionar cambios).
