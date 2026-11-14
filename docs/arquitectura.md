# Arquitectura de GOPS

GOPS | Gestión de OPS y Bonificaciones de Posgrados (USB Cali).
Arquitectura cliente-servidor de tres capas, cada una en su contenedor Docker.
La usa la Auxiliar administrativa de posgrados.

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
    subgraph LIDIS["GOPS en servidor LIDIS (Docker)"]
        direction LR
        F["<b>Frontend</b><br/>React + nginx<br/>puerto 8080"]
        B["<b>Backend</b><br/>Node.js 22<br/>puerto 3000"]
        DB[("<b>Base de datos</b><br/>SQLite gops.db<br/>volumen gops-data")]
    end
    IA["<b>API de Gemini</b><br/>Google"]
    U -->|"HTTPS"| F
    F -->|"/api/*"| B
    B -->|"lee y escribe"| DB
    B -->|"HTTPS + llave"| IA
    style U fill:#08427b,color:#fff,stroke:#052e56
    style F fill:#438dd5,color:#fff,stroke:#2e6295
    style B fill:#438dd5,color:#fff,stroke:#2e6295
    style DB fill:#438dd5,color:#fff,stroke:#2e6295
    style IA fill:#999,color:#fff,stroke:#6b6b6b
    style LIDIS fill:#fff,stroke:#555,stroke-dasharray:5 5
```

## Notas
- La clave de la IA vive solo en el servidor, nunca en el navegador.
- Los datos persisten en el volumen Docker `gops-data`, con respaldo diario y 30 días de retención.
- Los niveles 3 y 4 de C4 (componentes y código) no se documentan: el código ya los muestra.
