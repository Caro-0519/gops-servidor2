# Arquitectura de GOPS

GOPS | Gestión de OPS y Bonificaciones de Posgrados (USB Cali).
Arquitectura cliente-servidor de tres capas, cada una en su contenedor Docker.

## Vista general

```mermaid
flowchart LR
    U[Coordinadora] -->|HTTPS| F[Frontend React + nginx]
    F -->|"/api/*"| B[Backend Node.js]
    B -->|lee y escribe| DB[(SQLite gops.db)]
    B -->|HTTPS + llave| IA[API de Gemini]
```

## Nivel 1: Contexto

```mermaid
C4Context
    title Diagrama de contexto - GOPS
    Person(coord, "Coordinadora de posgrados", "Registra y sigue las OPS y bonificaciones de los docentes")
    System(gops, "GOPS", "Gestión de OPS y Bonificaciones de Posgrados")
    System_Ext(gemini, "API de Gemini (Google)", "IA que explica los hallazgos del auditor")
    Rel(coord, gops, "Usa desde el navegador", "HTTPS")
    Rel(gops, gemini, "Envía hallazgos y recibe explicaciones", "HTTPS")
```

## Nivel 2: Contenedores

```mermaid
C4Container
    title Diagrama de contenedores - GOPS
    Person(coord, "Coordinadora de posgrados", "Usuaria única de la aplicación")
    System_Boundary(gops, "GOPS en servidor LIDIS (Docker)") {
        Container(front, "Frontend", "React + nginx, puerto 8080", "Pantallas: OPS, bonificaciones, auditor, respaldo")
        Container(back, "Backend", "Node.js 22, puerto 3000", "API REST: login, guardado, respaldo, auditor con IA")
        ContainerDb(db, "Base de datos", "SQLite (gops.db) en volumen gops-data", "Estado de la app y respaldos diarios")
    }
    System_Ext(gemini, "API de Gemini", "Google")
    Rel(coord, front, "Usa", "HTTPS")
    Rel(front, back, "Llama a /api/*", "JSON/HTTPS")
    Rel(back, db, "Lee y escribe", "SQL")
    Rel(back, gemini, "Pide explicaciones", "HTTPS")
```

## Notas
- La clave de la IA vive solo en el servidor, nunca en el navegador.
- Los datos persisten en el volumen Docker `gops-data`, con respaldo diario y 30 días de retención.
- Los niveles 3 y 4 de C4 (componentes y código) no se documentan: el código ya los muestra.
