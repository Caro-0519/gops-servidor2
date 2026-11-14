# ADR-002: SQLite en un volumen de Docker como base de datos

- **Estado:** Aceptada (14 nov 2026)

## Contexto
La aplicación la usa una sola persona y maneja pocos registros. Se quería no administrar un servidor de base de datos y que los datos sobrevivan cuando se reconstruyen los contenedores.

## Decisión
Usar SQLite (archivo `gops.db`) con el módulo `node:sqlite` de Node.js, guardado en el volumen de Docker `gops-data`. Los datos se guardan como un documento JSON por clave en la tabla `kv`, con una copia diaria en `respaldos` (30 días de retención).

## Alternativas
1. PostgreSQL en un contenedor propio.
2. MySQL.

## Consecuencias
- **Ventajas:** un solo archivo, sin servicio adicional que administrar y respaldo sencillo.
- **Costos:** un solo escritor a la vez. Si el sistema se abre a varias facultades, habrá que migrar a una base de datos servidor y a un modelo con tablas. Además, el volumen es crítico: borrarlo borra todos los datos.
