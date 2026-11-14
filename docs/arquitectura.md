# Diagramas de arquitectura de GOPS

Modelo C4 en Mermaid. GitHub los dibuja automáticamente.
Los diagramas se verificaron contra el código (`server.js`, `app.jsx`, `entry.jsx`, `nginx.conf` y `docker-compose.yml`).

## Nivel 1: Contexto

```mermaid
flowchart LR
    U["<b>Auxiliar administrativa</b><br/>Registra y sigue las OPS y<br/>bonificaciones de los docentes"]
    G["<b>GOPS</b><br/>Gestión de OPS y<br/>Bonificaciones de Posgrados"]
    IA["<b>API de Gemini (Google)</b><br/>Sistema externo: explica los<br/>hallazgos del auditor"]
    U -->|"usa desde el navegador"| G
    G -->|"envía hallazgos"| IA
    style U fill:#08427b,color:#fff,stroke:#052e56
    style G fill:#1168bd,color:#fff,stroke:#0b4884
    style IA fill:#999,color:#fff,stroke:#6b6b6b
```

## Nivel 2: Contenedores

```mermaid
flowchart LR
    U["<b>Auxiliar administrativa</b><br/>Usuaria de la aplicación"]
    P["<b>Panel de LIDIS</b><br/>enruta según la URL"]
    subgraph DOCKER["Servidor LIDIS (Docker Compose)"]
        F["<b>Frontend</b><br/>React 18 + nginx, puerto 8080<br/>pantallas, reglas del auditor,<br/>tarifas, importar Excel (xlsx)"]
        B["<b>Backend</b><br/>Node.js 22, puerto 3000<br/>sesión, guardado, respaldos,<br/>relé hacia la IA"]
        DB[("<b>Base de datos</b><br/>SQLite gops.db<br/>volumen gops-data")]
    end
    IA["<b>API de Gemini</b><br/>Google"]
    U -->|"HTTPS"| P
    P -->|"/gops/ (HTTP)"| F
    P -->|"/gops/api/ (HTTP)"| B
    B -->|"SQL (node:sqlite)"| DB
    B -->|"HTTPS + llave"| IA
    style U fill:#08427b,color:#fff,stroke:#052e56
    style P fill:#999,color:#fff,stroke:#6b6b6b
    style F fill:#438dd5,color:#fff,stroke:#2e6295
    style B fill:#438dd5,color:#fff,stroke:#2e6295
    style DB fill:#438dd5,color:#fff,stroke:#2e6295
    style IA fill:#999,color:#fff,stroke:#6b6b6b
    style DOCKER fill:#fff,stroke:#555,stroke-dasharray:5 5
```

## Nivel 3: Componentes

```mermaid
flowchart LR
    subgraph FRONT["Frontend (React)"]
        APP["<b>app.jsx</b><br/>Pantallas, estados de la OPS,<br/>reglas del auditor, importar Excel,<br/>autoguardado"]
        ENT["<b>entry.jsx</b><br/>window.storage:<br/>get, set, delete, list<br/>y descarga de respaldo"]
    end
    subgraph BACK["Backend (Node.js, server.js)"]
        AUT["<b>Autenticación</b><br/>login, cambiar-clave,<br/>scrypt + token JWT 12 h"]
        LIM["<b>Límite de intentos</b><br/>bloqueo 5 min<br/>tras 5 fallos"]
        STO["<b>Almacenamiento</b><br/>GET / PUT / DELETE<br/>/api/storage/clave"]
        RES["<b>Respaldos</b><br/>diario, 30 días<br/>GET /api/respaldo"]
        IAC["<b>Relé de IA</b><br/>adaptadores Gemini,<br/>Anthropic, OpenAI,<br/>con reintentos"]
    end
    DB[("<b>SQLite gops.db</b><br/>kv, respaldos,<br/>usuario, meta")]
    GEM["<b>API de Gemini</b><br/>Google"]
    APP --> ENT
    ENT -->|"/api/login"| AUT
    ENT -->|"/api/storage"| STO
    ENT -->|"/api/respaldo"| RES
    APP -->|"/api/ia"| IAC
    AUT --> LIM
    AUT --> DB
    STO --> DB
    RES --> DB
    IAC -->|"HTTPS + llave"| GEM
    style FRONT fill:#fff,stroke:#555,stroke-dasharray:5 5
    style BACK fill:#fff,stroke:#555,stroke-dasharray:5 5
    style APP fill:#85bbf0,color:#000
    style ENT fill:#85bbf0,color:#000
    style AUT fill:#85bbf0,color:#000
    style LIM fill:#85bbf0,color:#000
    style STO fill:#85bbf0,color:#000
    style RES fill:#85bbf0,color:#000
    style IAC fill:#85bbf0,color:#000
    style GEM fill:#999,color:#fff
```

## Nivel 4: Código (flujo de guardado)

```mermaid
sequenceDiagram
    actor U as Auxiliar administrativa
    participant A as app.jsx (autoguardado)
    participant S as entry.jsx (window.storage)
    participant API as server.js (/api/storage)
    participant DB as SQLite (tabla kv)
    U->>A: crea o edita un registro
    A->>A: espera 500 ms (debounce)
    A->>S: set("ops-app-state-v1", estado)
    S->>API: PUT /api/storage/ops-app-state-v1 (token)
    API->>API: verifica token JWT
    alt token válido
        API->>DB: guarda valor y updated_at
        DB-->>API: ok
        API-->>S: 200
        S-->>A: guardado exitoso
    else sin token o vencido
        API-->>S: 401
        S-->>A: cierra sesión
    else falla el servidor
        API-->>S: error 5xx
        S-->>A: error "No se pudo guardar"
        A-->>U: aviso: revisa tu conexión
    end
```


