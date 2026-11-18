"use strict";
/* Pruebas del backend de GOPS con el ejecutor de pruebas incluido en Node (node:test), sin dependencias.
   Ejecutar desde la raíz del repositorio:   node --test backend/unit.test.js
   Cada prueba lleva encima una línea que explica qué verifica. */
const { test, after } = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const assert = require("node:assert/strict");
const os = require("os");
const path = require("path");
const fs = require("fs");

// Base de datos temporal y puerto libre: no se toca ningún dato real.
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), "gops-test-"));
process.env.DB_PATH = path.join(carpeta, "gops.db");
process.env.PORT = "0";
delete process.env.CLAVE_INSTALACION;
delete process.env.IA_PROVIDER;
const { servidor, hashClave, verificarClave, firmar, validarToken, ipDe } = require("./server.js");

after(() => { servidor.close(); fs.rmSync(carpeta, { recursive: true, force: true }); });

const escuchando = () => new Promise((ok) => (servidor.listening ? ok() : servidor.once("listening", ok)));
async function api(metodo, ruta, cuerpo, token, extra = {}) {
  await escuchando();
  const r = await fetch(`http://127.0.0.1:${servidor.address().port}${ruta}`, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  let json = null; try { json = await r.json(); } catch (e) { /* sin cuerpo */ }
  return { status: r.status, json };
}
const ahora = () => Math.floor(Date.now() / 1000);

/* ---------- Unitarias: contraseñas ---------- */

// Caso feliz: la clave correcta coincide con el hash que se guardó.
test("verificarClave acepta la contraseña correcta", () => {
  assert.equal(verificarClave("Clave-Segura-1", hashClave("Clave-Segura-1")), true);
});

// Una contraseña distinta no debe entrar.
test("verificarClave rechaza una contraseña incorrecta", () => {
  assert.equal(verificarClave("otra-clave-123", hashClave("Clave-Segura-1")), false);
});

// El hash guarda algoritmo y sal, y nunca la contraseña en texto.
test("hashClave guarda formato scrypt con sal y no contiene la contraseña", () => {
  const h = hashClave("Clave-Segura-1");
  assert.match(h, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.equal(h.includes("Clave-Segura-1"), false);
});

// La sal aleatoria hace que la misma clave produzca hashes distintos.
test("hashClave produce hashes distintos para la misma contraseña", () => {
  assert.notEqual(hashClave("Clave-Segura-1"), hashClave("Clave-Segura-1"));
});

// Entradas inválidas: un hash dañado o vacío se rechaza sin lanzar error.
test("verificarClave rechaza hashes guardados con formato inválido", () => {
  for (const malo of ["", "basura", "md5$a$b", "scrypt$$", undefined, null]) {
    assert.equal(verificarClave("Clave-Segura-1", malo), false, `debía rechazar ${String(malo)}`);
  }
});

/* ---------- Unitarias: token de sesión ---------- */

// Caso feliz: un token vigente devuelve a quién pertenece.
test("validarToken acepta un token vigente y devuelve el usuario", () => {
  const p = validarToken(firmar({ sub: "carolina", exp: ahora() + 3600 }));
  assert.equal(p.sub, "carolina");
});

// Valor límite: un token que venció hace un segundo ya no sirve.
test("validarToken rechaza un token vencido", () => {
  assert.equal(validarToken(firmar({ sub: "carolina", exp: ahora() - 1 })), null);
});

// Si alguien cambia el contenido del token, la firma ya no coincide.
test("validarToken rechaza un token con la firma alterada", () => {
  const [a, , c] = firmar({ sub: "carolina", exp: ahora() + 3600 }).split(".");
  const falso = Buffer.from(JSON.stringify({ sub: "otro", exp: ahora() + 3600 })).toString("base64url");
  assert.equal(validarToken(`${a}.${falso}.${c}`), null);
});

// Entradas inválidas: textos que no tienen forma de token.
test("validarToken rechaza textos que no son un token", () => {
  for (const malo of ["", "abc", "a.b", "a.b.c.d", undefined, null]) {
    assert.equal(validarToken(malo), null, `debía rechazar ${String(malo)}`);
  }
});

/* ---------- Unitarias: IP del cliente (bloqueo de intentos) ---------- */

// Con una sola dirección en la cabecera se usa esa.
test("ipDe usa la dirección de X-Forwarded-For cuando hay una sola", () => {
  assert.equal(ipDe({ headers: { "x-forwarded-for": "10.0.0.7" }, socket: {} }), "10.0.0.7");
});

// Seguridad: si el cliente falsifica la cabecera, vale la última, que agrega el proxy.
test("ipDe toma la ÚLTIMA dirección de X-Forwarded-For, no la que escribe el cliente", () => {
  assert.equal(ipDe({ headers: { "x-forwarded-for": "1.1.1.1, 10.0.0.7" }, socket: {} }), "10.0.0.7");
});

// Sin cabecera se usa la dirección de la conexión.
test("ipDe usa la dirección del socket si no hay cabecera", () => {
  assert.equal(ipDe({ headers: {}, socket: { remoteAddress: "127.0.0.1" } }), "127.0.0.1");
});

/* ---------- API (el servidor real con una base temporal) ---------- */

// Código de estado 200 y cuerpo mínimo del chequeo de salud.
test("GET /api/salud responde 200 con ok:true", async () => {
  const r = await api("GET", "/api/salud");
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, true);
});

// Sin sesión no se puede leer ni guardar nada.
test("las rutas de datos sin token responden 401", async () => {
  assert.equal((await api("GET", "/api/storage?prefix=")).status, 401);
  assert.equal((await api("PUT", "/api/storage/x", { value: "1" })).status, 401);
});

// Mejora #1: con CLAVE_INSTALACION definida, crear la cuenta exige esa clave.
test("POST /api/configurar exige la clave de instalación cuando está definida", async () => {
  process.env.CLAVE_INSTALACION = "clave-del-servidor";
  try {
    const sin = await api("POST", "/api/configurar", { usuario: "carolina", clave: "Clave-Segura-1" });
    assert.equal(sin.status, 403);
    const mala = await api("POST", "/api/configurar", { usuario: "carolina", clave: "Clave-Segura-1", claveInstalacion: "otra" });
    assert.equal(mala.status, 403);
    const ok = await api("POST", "/api/configurar", { usuario: "carolina", clave: "Clave-Segura-1", claveInstalacion: "clave-del-servidor" });
    assert.equal(ok.status, 200);
    assert.ok(ok.json.token);
  } finally { delete process.env.CLAVE_INSTALACION; }
});

// Una vez creada la cuenta, nadie puede crear otra.
test("POST /api/configurar no permite crear una segunda cuenta (409)", async () => {
  const r = await api("POST", "/api/configurar", { usuario: "otro", clave: "Clave-Segura-2" });
  assert.equal(r.status, 409);
});

// Entrada inválida: contraseña incorrecta devuelve 401 con un mensaje genérico.
test("POST /api/login con contraseña incorrecta responde 401", async () => {
  const r = await api("POST", "/api/login", { usuario: "carolina", clave: "mala-clave" });
  assert.equal(r.status, 401);
  assert.match(r.json.error, /incorrectos/);
});

// Caso feliz de datos: lo que se guarda es exactamente lo que se lee.
test("guardar y leer una clave de storage devuelve el mismo valor", async () => {
  const t = (await api("POST", "/api/login", { usuario: "carolina", clave: "Clave-Segura-1" })).json.token;
  assert.equal((await api("PUT", "/api/storage/ops-app-state-v1", { value: '{"records":[1,2,3]}' }, t)).status, 200);
  const r = await api("GET", "/api/storage/ops-app-state-v1", undefined, t);
  assert.equal(r.status, 200);
  assert.equal(r.json.value, '{"records":[1,2,3]}');
});

// Error esperado: pedir algo que no existe da 404, no 500.
test("leer una clave que no existe responde 404", async () => {
  const t = (await api("POST", "/api/login", { usuario: "carolina", clave: "Clave-Segura-1" })).json.token;
  assert.equal((await api("GET", "/api/storage/no-existe", undefined, t)).status, 404);
});

// Mejora #4: una clave mal codificada es un error del cliente (400), no del servidor (500).
test("una clave de storage con % mal escrito responde 400", async () => {
  const t = (await api("POST", "/api/login", { usuario: "carolina", clave: "Clave-Segura-1" })).json.token;
  const r = await api("GET", "/api/storage/%E0%A4%A", undefined, t);
  assert.equal(r.status, 400);
});

// Validación: guardar sin el campo "value" se rechaza.
test("PUT sin valor responde 400", async () => {
  const t = (await api("POST", "/api/login", { usuario: "carolina", clave: "Clave-Segura-1" })).json.token;
  assert.equal((await api("PUT", "/api/storage/ops-app-state-v1", {}, t)).status, 400);
});

// Sin proveedor configurado, la IA avisa con 501 y los demás módulos siguen funcionando.
test("POST /api/ia sin proveedor configurado responde 501", async () => {
  const t = (await api("POST", "/api/login", { usuario: "carolina", clave: "Clave-Segura-1" })).json.token;
  const r = await api("POST", "/api/ia", { messages: [] }, t);
  assert.equal(r.status, 501);
});

// Respaldo: las copias diarias de más de 30 días se borran y las recientes se conservan.
test("al guardar se eliminan los respaldos de más de 30 días y se conservan los recientes", async () => {
  const t = (await api("POST", "/api/login", { usuario: "carolina", clave: "Clave-Segura-1" })).json.token;
  const bd = new DatabaseSync(process.env.DB_PATH);
  const dia = (hace) => new Date(Date.now() - hace * 86400000).toISOString().slice(0, 10);
  bd.prepare("INSERT INTO respaldos (dia, key, value) VALUES (?, 'k-vieja', '1'), (?, 'k-reciente', '2')").run(dia(40), dia(5));
  assert.equal((await api("PUT", "/api/storage/ops-app-state-v1", { value: '{"records":[]}' }, t)).status, 200);
  const quedan = bd.prepare("SELECT key FROM respaldos WHERE key IN ('k-vieja', 'k-reciente') ORDER BY key").all().map((f) => f.key);
  bd.close();
  assert.deepEqual(quedan, ["k-reciente"]);
});

// Seguridad: tras 5 intentos fallidos desde la misma IP, hasta la contraseña correcta recibe 429.
// (Se usa una IP propia en X-Forwarded-For para no bloquear a las demás pruebas.)
test("el bloqueo de 5 minutos se activa tras 5 intentos fallidos desde la misma IP", async () => {
  const ip = { "x-forwarded-for": "203.0.113.9" };
  for (let i = 0; i < 4; i++) {
    assert.equal((await api("POST", "/api/login", { usuario: "carolina", clave: "mala" }, undefined, ip)).status, 401);
  }
  assert.equal((await api("POST", "/api/login", { usuario: "carolina", clave: "mala" }, undefined, ip)).status, 401);
  const bloqueada = await api("POST", "/api/login", { usuario: "carolina", clave: "Clave-Segura-1" }, undefined, ip);
  assert.equal(bloqueada.status, 429);
  const otraIp = await api("POST", "/api/login", { usuario: "carolina", clave: "Clave-Segura-1" }, undefined, { "x-forwarded-for": "203.0.113.10" });
  assert.equal(otraIp.status, 200);
});
