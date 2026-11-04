# GOPS · Gestión de OPS y Bonificaciones de Posgrados

Aplicación web que reemplaza el Excel con el que se gestionaban las **OPS** (órdenes de prestación de servicios) y las **bonificaciones** de los docentes de posgrado de la Universidad San Buenaventura Cali.
Proyecto del Diplomado en Ingeniería de Software con Inteligencia Artificial, Módulo 3 (implementación incremental del MVP e integración de servicios).

- **Aplicación publicada:** https://lidis.usbcali.edu.co/gops/
- **Autora:** Carolina Gonzalez Ortega

## Caso de uso del MVP

**CU-01 · Registrar una OPS y llevarla hasta el pago.**
La auxiliar administrativa registra la OPS de un docente (programa, módulo, horas, fechas). La app calcula el valor con la tabla de tarifas, liquida la seguridad social del mes en que termina el módulo, controla los documentos y avanza el estado hasta el pago. Antes de pagar, el **auditor inteligente** revisa los registros y la IA explica los hallazgos.

Estados de una OPS: OPS Solicitada → OPS Elaborada → Documentos Solicitados → Documentos Recibidos → Visto Bueno Director/Coordinador → Visto Bueno Decanatura → Enviado a OPS → Pendiente de pago → Pagado.

## Qué está implementado y qué es futuro

| Implementado (MVP) | Futuro (no incluido) |
| --- | --- |
| Registro de OPS y bonificaciones con avance de estados | Envío directo de correos desde la app (hoy se preparan borradores) |
| Cálculo de valor por tarifa (tipo de programa × categoría) | Varios usuarios con roles (hoy hay un usuario único) |
| Liquidación de seguridad social (IBC 40 %, salud 12,5 %, pensión 16 %, ARL I–III) | Base de datos relacional con una tabla por entidad |
| Control de documentos por OPS | Base de datos en la nube administrada (p. ej. Supabase) |
| Revisión preliminar de documentos con IA (los archivos no se guardan) | Notificaciones automáticas |
| Tablero de inicio con lo urgente | |
| Importar y exportar Excel | |
| **Auditor inteligente** (reglas + IA que solo sugiere) | |
| Inicio de sesión, datos en SQLite y respaldos diarios | |
| Docker Compose y configuración por variables de entorno | |

## Estructura del repositorio

```
backend/            API en Node.js + SQLite (sin dependencias externas)
  server.js         rutas, sesión, persistencia e integración de IA
  test.js           pruebas automáticas del backend
  Dockerfile
frontend/
  src/              código fuente de la interfaz (React): app.jsx y entry.jsx
  scripts/build.js  compila la interfaz hacia site/dist
  site/             lo que sirve nginx (index.html y dist/)
  Dockerfile, nginx.conf
docs/               API.md, openapi.yaml y ARQUITECTURA.md
docker-compose.yml  levanta frontend + backend + volumen de datos
.env.example        plantilla de configuración (sin secretos)
```

## Requisitos

- Docker y Docker Compose (para ejecutarlo).
- Node.js 22 o superior (solo para desarrollo y pruebas).

## Instalación y ejecución con Docker

```bash
git clone https://github.com/Caro-0519/gops-servidor2.git gops
cd gops
cp .env.example .env        # edita .env y pon tu llave de IA (opcional)
docker compose up -d --build
```

La aplicación queda en http://localhost:8080 y la API en http://localhost:3000. La primera vez, la pantalla pide **crear la cuenta de acceso**.

Comandos útiles:

```bash
docker compose ps                       # estado de los servicios
docker compose logs --tail 30 backend   # registros del servidor
docker cp gops-backend:/data/gops.db ./gops-respaldo.db   # copia de la base
docker compose up -d --build            # actualizar tras un git pull
```

Los datos viven en el volumen `gops-data` (archivo `/data/gops.db`): no se pierden al reconstruir los contenedores.

## Variables de entorno

Copia `.env.example` como `.env`. **El archivo `.env` no se sube a GitHub.**

| Variable | Para qué sirve | Valor por defecto |
| --- | --- | --- |
| `IA_PROVIDER` | Proveedor de IA: `gemini`, `anthropic`, `openai` o `none` | `none` |
| `IA_API_KEY` | Llave del proveedor | vacío |
| `IA_MODEL` | Modelo principal | el del proveedor |
| `IA_MODEL_ALT` | Modelo de respaldo si el principal está saturado | vacío |
| `IA_BASE_URL` | Dirección para modelos propios o compatibles con OpenAI | vacío |
| `TOKEN_HORAS` | Duración de la sesión | `12` |
| `JWT_SECRET` | Secreto de los tokens (vacío = se genera uno aleatorio) | aleatorio |
| `IA_ESPERAS_MS` | Esperas entre reintentos si la IA está saturada | `2000,5000,10000` |

## Desarrollo y pruebas

```bash
# Backend (sin instalar nada)
node backend/test.js                    # pruebas automáticas de la API

# Frontend
cd frontend
npm install
npm run build                           # regenera site/dist desde src/
```

## API

Rutas, parámetros, solicitudes y respuestas reales: [`docs/API.md`](docs/API.md). Especificación formal (se puede abrir en Swagger Editor o importar en Postman/Bruno): [`docs/openapi.yaml`](docs/openapi.yaml).

## Integración de IA

El auditor primero aplica **reglas fijas** (duplicados, tarifa distinta a la vigente, fechas incoherentes, pago antes de terminar el módulo, etc.). Luego, con el botón *Explicar y priorizar con IA*, la interfaz envía **solo los hallazgos** (no documentos ni correos) a `POST /api/ia`. Una segunda función de IA hace una revisión preliminar de los documentos de una OPS (PDF o imagen): el archivo se envía para revisarlo y no se guarda. El backend traduce la consulta al proveedor configurado (Gemini por defecto), reintenta si el modelo está saturado y devuelve una explicación y un orden de prioridad. **La IA solo sugiere: nunca modifica datos.**

## Arquitectura

Tres capas (interfaz, API, base de datos) en dos contenedores. Detalle y decisiones en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Seguridad

- Contraseña cifrada con scrypt; sesión con token firmado de 12 horas.
- Bloqueo de 5 minutos tras 5 intentos fallidos de ingreso.
- Consultas SQL con parámetros.
- Llaves y contraseñas solo en `.env` (ignorado por Git); aquí solo hay `.env.example`.

## Flujo de trabajo con Git

La rama `main` está protegida por convención: los cambios se hacen en una rama de desarrollo (`desarrollo` o `feature/...`), con commits descriptivos, y se integran por **Pull Request**.

## Uso responsable de IA

El proyecto se desarrolló con ayuda de Claude (Anthropic) para programar, depurar y documentar. Cada sugerencia se revisó, se probó con pruebas automáticas y con uso real, y se corrigió cuando fue necesario. Los detalles están en el informe de entrega.
