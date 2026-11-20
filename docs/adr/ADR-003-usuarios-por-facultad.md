# ADR-003: Varios usuarios, con los datos separados por facultad

- **Estado:** Aceptada (20 nov 2026)

## Contexto
GOPS nació para una sola persona (Facultad de Ingeniería). Otra facultad necesita usarla, pero sus registros, programas, tarifas y coordinadores no deben mezclarse con los de Ingeniería, ni ser visibles entre sí.

## Decisión
- Tabla `usuarios` (nombre, contraseña cifrada con scrypt, rol, facultad, activo). La cuenta única anterior se migra sola como **administrador de Ingeniería**, con su misma contraseña; la tabla antigua `usuario` no se borra.
- El token firmado incluye usuario, rol y facultad, y en cada petición el servidor comprueba que el usuario siga activo.
- **Aislamiento en el servidor:** la clave que pide el navegador (`ops-app-state-v1`) se traduce a la clave real. Ingeniería conserva sus claves tal cual; las demás facultades usan `fac:<facultad>:<clave>`. El navegador no puede pedir claves de otras facultades.
- Solo el administrador crea usuarios, restablece contraseñas y activa o desactiva cuentas, y puede descargar el respaldo de todas las facultades.
- Cada facultad empieza vacía: sin registros, programas, coordinadores ni decana.

## Alternativas
1. Una instancia de GOPS por facultad (separación total, pero hay que desplegar y mantener varias copias).
2. Una sola base con una columna `facultad` en cada registro (requiere migrar el modelo de datos a tablas).

## Consecuencias
- **Ventajas:** no cambia el formato de los datos, la migración de Ingeniería es transparente y se prueba con pruebas automáticas de aislamiento.
- **Costos:** el estado de cada facultad sigue siendo un documento JSON único; no hay informes entre facultades. Si crece mucho, conviene migrar a tablas y una base de datos servidor (ver ADR-002).
- **Pendiente:** recuperación de contraseña por el propio usuario y doble factor.


## Colores institucionales y color por facultad

La interfaz usa los colores de la Universidad San Buenaventura: negro #1A171B, naranja #EB8600 y gris #C6C7C8.
Cada facultad tiene un color de acento propio (variable `--fac`): Ingeniería usa morado #4B2FB8; una facultad nueva empieza en el negro institucional.
El color se guarda en la tabla `meta` (`fac-color:<facultad>`), viaja en el token como `color` y lo cambia el administrador desde "Usuarios y facultades" (`POST /api/usuarios/color`).
