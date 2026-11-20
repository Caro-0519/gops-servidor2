"use strict";
/* GOPS · backend. Sin dependencias externas (solo módulos incluidos en Node 22).
   - Datos: SQLite en /data/gops.db (volumen de Docker).
   - Sesión: usuarios con contraseña cifrada (scrypt) y token firmado (HMAC-SHA256) de 12 h.
   - Facultades: cada usuario pertenece a una facultad y solo ve los datos de la suya. Los datos de la facultad
     original ("ingenieria") conservan sus claves; las demás se guardan con el prefijo "fac:<facultad>:".
     El primer usuario (el que crea la cuenta) es el administrador y puede crear usuarios de otras facultades.
   - IA: adaptadores intercambiables (anthropic | openai | gemini) elegidos por variables de entorno.
   Las rutas llegan sin el prefijo /gops; se aceptan con o sin el prefijo /api. */
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || "/data/gops.db";
const TOKEN_HORAS = Number(process.env.TOKEN_HORAS || 12);
const MAX_BODY = 25 * 1024 * 1024;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS respaldos (dia TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (dia, key));
  CREATE TABLE IF NOT EXISTS usuario (id INTEGER PRIMARY KEY CHECK (id = 1), nombre TEXT NOT NULL, hash TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE COLLATE NOCASE, hash TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'facultad', fac TEXT NOT NULL, facultad TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1, creado TEXT NOT NULL
  );
`);
const FAC_ORIGINAL = "ingenieria";
const NOMBRE_FAC_ORIGINAL = "Facultad de Ingeniería";
// Migración: la cuenta única anterior pasa a ser el administrador de la facultad original (la tabla vieja no se borra)
if (!db.prepare("SELECT 1 FROM usuarios LIMIT 1").get()) {
  const vieja = db.prepare("SELECT nombre, hash FROM usuario WHERE id = 1").get();
  if (vieja) db.prepare("INSERT INTO usuarios (nombre, hash, rol, fac, facultad, creado) VALUES (?, ?, 'admin', ?, ?, ?)").run(vieja.nombre, vieja.hash, FAC_ORIGINAL, NOMBRE_FAC_ORIGINAL, new Date().toISOString());
}
// Color de cada facultad (la identidad de la universidad es negro y naranja; Ingeniería usa morado)
const COLOR_HEX = /^#[0-9a-fA-F]{6}$/;
const colorDe = (fac) => meta(`fac-color:${fac}`) || (fac === FAC_ORIGINAL ? "#4B2FB8" : "#1A171B");
const slugFacultad = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/^facultad\s+de\s+(la\s+|los\s+|las\s+)?/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ---------- secretos y contraseñas ---------- */
function meta(k) { const r = db.prepare("SELECT v FROM meta WHERE k = ?").get(k); return r ? r.v : null; }
function setMeta(k, v) { db.prepare("INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").run(k, v); }
let JWT_SECRET = process.env.JWT_SECRET || meta("jwt_secret");
if (!JWT_SECRET) { JWT_SECRET = crypto.randomBytes(32).toString("hex"); setMeta("jwt_secret", JWT_SECRET); }

function hashClave(clave) {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(clave, salt, 64).toString("hex");
  return `scrypt$${salt}$${h}`;
}
function verificarClave(clave, guardado) {
  const [alg, salt, h] = String(guardado).split("$");
  if (alg !== "scrypt" || !salt || !h) return false;
  const calc = crypto.scryptSync(clave, salt, 64);
  const esperado = Buffer.from(h, "hex");
  return calc.length === esperado.length && crypto.timingSafeEqual(calc, esperado);
}
const b64 = (b) => Buffer.from(b).toString("base64url");
function firmar(payload) {
  const cuerpo = `${b64(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64(JSON.stringify(payload))}`;
  return `${cuerpo}.${crypto.createHmac("sha256", JWT_SECRET).update(cuerpo).digest("base64url")}`;
}
function validarToken(token) {
  const p = String(token || "").split(".");
  if (p.length !== 3) return null;
  const esperado = crypto.createHmac("sha256", JWT_SECRET).update(`${p[0]}.${p[1]}`).digest("base64url");
  const a = Buffer.from(p[2]), b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(p[1], "base64url").toString("utf8"));
    return payload.exp * 1000 > Date.now() ? payload : null;
  } catch (e) { return null; }
}
const emitirToken = (u) => ({ token: firmar({ sub: u.nombre, uid: u.id, rol: u.rol, fac: u.fac, facultad: u.facultad, color: colorDe(u.fac), exp: Math.floor(Date.now() / 1000) + TOKEN_HORAS * 3600 }), horas: TOKEN_HORAS });

/* ---------- límite de intentos de ingreso ---------- */
const intentos = new Map(); // ip -> { n, hasta }
function bloqueado(ip) { const r = intentos.get(ip); return r && r.hasta > Date.now(); }
function falla(ip) {
  const r = intentos.get(ip) || { n: 0, hasta: 0 };
  r.n += 1;
  if (r.n >= 5) { r.hasta = Date.now() + 5 * 60 * 1000; r.n = 0; }
  intentos.set(ip, r);
}

/* ---------- IA: adaptadores ---------- */
const IA = {
  proveedor: (process.env.IA_PROVIDER || "none").toLowerCase(),
  llave: process.env.IA_API_KEY || "",
  modelo: process.env.IA_MODEL || "",
  baseUrl: (process.env.IA_BASE_URL || "").replace(/\/$/, ""),
};
const MODELOS_POR_DEFECTO = { anthropic: "claude-sonnet-4-6", openai: "gpt-4o", gemini: "gemini-3.8-flash" };
const iaActiva = () => ["anthropic", "openai", "gemini"].includes(IA.proveedor) && (IA.llave || IA.baseUrl);
const modeloIA = () => IA.modelo || MODELOS_POR_DEFECTO[IA.proveedor];
const bloques = (m) => (typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content || []);

/* Reintentos: si el proveedor está saturado (429/500/502/503/504) se espera y se reintenta;
   si IA_MODEL_ALT está definido, el último intento usa ese modelo alterno. */
const ESPERAS_MS = (process.env.IA_ESPERAS_MS || "2000,5000,10000").split(",").map(Number);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const TRANSITORIOS = new Set([429, 500, 502, 503, 504]);
async function llamarIA(req) {
  const alterno = process.env.IA_MODEL_ALT || "";
  let r;
  for (let i = 0; i <= ESPERAS_MS.length; i++) {
    const ultimo = i === ESPERAS_MS.length;
    const pedido = ultimo && alterno && alterno !== modeloIA() ? { ...req, _modelo: alterno } : req;
    try { r = await ADAPTADORES[IA.proveedor](pedido); } catch (e) { r = errorAnthropic(502, "No se pudo conectar con el proveedor de IA."); }
    if (!TRANSITORIOS.has(r.status)) return r;
    if (!ultimo) await dormir(ESPERAS_MS[i]);
  }
  return r;
}

async function postJSON(url, headers, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  let json = null;
  try { json = await r.json(); } catch (e) { /* sin cuerpo JSON */ }
  return { status: r.status, ok: r.ok, json };
}
const errorAnthropic = (status, mensaje) => ({ status, json: { type: "error", error: { type: "api_error", message: mensaje } } });
const respuestaTexto = (texto) => ({ status: 200, json: { type: "message", role: "assistant", content: [{ type: "text", text: texto }] } });

const ADAPTADORES = {
  async anthropic(req) {
    const r = await postJSON(`${IA.baseUrl || "https://api.anthropic.com"}/v1/messages`, { "x-api-key": IA.llave, "anthropic-version": "2023-06-01" },
      { model: req._modelo || modeloIA(), max_tokens: req.max_tokens || 1000, messages: req.messages });
    return { status: r.status, json: r.json };
  },
  async openai(req) {
    const mensajes = req.messages.map((m) => ({
      role: m.role,
      content: bloques(m).map((b) => {
        if (b.type === "text") return { type: "text", text: b.text };
        if (b.type === "image") return { type: "image_url", image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } };
        if (b.type === "document") return { type: "file", file: { filename: "documento.pdf", file_data: `data:${b.source.media_type};base64,${b.source.data}` } };
        return { type: "text", text: "" };
      }),
    }));
    const r = await postJSON(`${IA.baseUrl || "https://api.openai.com"}/v1/chat/completions`, IA.llave ? { Authorization: `Bearer ${IA.llave}` } : {},
      { model: req._modelo || modeloIA(), max_completion_tokens: req.max_tokens || 1000, messages: mensajes });
    if (!r.ok) return errorAnthropic(r.status, (r.json && r.json.error && r.json.error.message) || `HTTP ${r.status}`);
    const texto = r.json && r.json.choices && r.json.choices[0] && r.json.choices[0].message ? r.json.choices[0].message.content : "";
    return respuestaTexto(texto || "");
  },
  async gemini(req) {
    const contenido = req.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: bloques(m).map((b) => (b.type === "text" ? { text: b.text } : { inline_data: { mime_type: b.source.media_type, data: b.source.data } })),
    }));
    const r = await postJSON(`${IA.baseUrl || "https://generativelanguage.googleapis.com"}/v1beta/models/${req._modelo || modeloIA()}:generateContent`, { "x-goog-api-key": IA.llave },
      { contents: contenido, generationConfig: { maxOutputTokens: req.max_tokens || 1000 } });
    if (!r.ok) return errorAnthropic(r.status, (r.json && r.json.error && r.json.error.message) || `HTTP ${r.status}`);
    const partes = r.json && r.json.candidates && r.json.candidates[0] && r.json.candidates[0].content ? r.json.candidates[0].content.parts || [] : [];
    return respuestaTexto(partes.map((p) => p.text || "").join(""));
  },
};

/* ---------- utilidades HTTP ---------- */
function enviar(res, status, obj, extra = {}) {
  const cuerpo = typeof obj === "string" ? obj : JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra });
  res.end(cuerpo);
}
function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let total = 0; const trozos = [];
    req.on("data", (c) => { total += c.length; if (total > MAX_BODY) { reject(Object.assign(new Error("Cuerpo demasiado grande"), { status: 413 })); req.destroy(); } else trozos.push(c); });
    req.on("end", () => { try { resolve(trozos.length ? JSON.parse(Buffer.concat(trozos).toString("utf8")) : {}); } catch (e) { reject(Object.assign(new Error("JSON inválido"), { status: 400 })); } });
    req.on("error", reject);
  });
}
const ipDe = (req) => String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",").pop().trim();
const hayUsuarios = () => !!db.prepare("SELECT 1 FROM usuarios LIMIT 1").get();
const usuarioPorNombre = (n) => db.prepare("SELECT * FROM usuarios WHERE nombre = ? AND activo = 1").get(String(n || "").trim());
const usuarioPorId = (id) => db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id);
/* Aislamiento por facultad: la clave que pide el navegador se traduce a la clave real del servidor */
const prefijoFac = (s) => (s.fac === FAC_ORIGINAL ? "" : `fac:${s.fac}:`);
const claveReal = (s, key) => `${prefijoFac(s)}${key}`;
const claveVisible = (s, key) => key.slice(prefijoFac(s).length);

/* ---------- servidor ---------- */
const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let ruta = url.pathname.replace(/^\/gops(?=\/|$)/, "").replace(/^\/api(?=\/|$)/, "").replace(/\/+$/, "") || "/";
    const m = req.method;

    // públicas
    if (m === "GET" && (ruta === "/salud" || ruta === "/")) return enviar(res, 200, { ok: true });
    if (m === "GET" && ruta === "/estado") return enviar(res, 200, { hayUsuario: hayUsuarios() });
    // Lista de usuarios activos para elegir en la pantalla de ingreso (solo nombre, facultad y color; nunca claves).
    if (m === "GET" && ruta === "/ingreso/usuarios") {
      const filas = db.prepare("SELECT nombre, facultad, fac, rol FROM usuarios WHERE activo = 1 ORDER BY facultad, nombre").all();
      return enviar(res, 200, { usuarios: filas.map((u) => ({ nombre: u.nombre, facultad: u.facultad, rol: u.rol, color: colorDe(u.fac) })) });
    }
    if (m === "POST" && ruta === "/configurar") {
      if (hayUsuarios()) return enviar(res, 409, { error: "Ya hay una cuenta configurada." });
      const { usuario: nombre, clave, claveInstalacion } = await leerCuerpo(req);
if (process.env.CLAVE_INSTALACION && claveInstalacion !== process.env.CLAVE_INSTALACION) return enviar(res, 403, { error: "Clave de instalación incorrecta." });
      if (!nombre || String(nombre).trim().length < 3) return enviar(res, 400, { error: "El usuario debe tener al menos 3 caracteres." });
      if (!clave || String(clave).length < 8) return enviar(res, 400, { error: "La contraseña debe tener al menos 8 caracteres." });
      const r = db.prepare("INSERT INTO usuarios (nombre, hash, rol, fac, facultad, creado) VALUES (?, ?, 'admin', ?, ?, ?)").run(String(nombre).trim(), hashClave(String(clave)), FAC_ORIGINAL, NOMBRE_FAC_ORIGINAL, new Date().toISOString());
      return enviar(res, 200, emitirToken(usuarioPorId(Number(r.lastInsertRowid))));
    }
    if (m === "POST" && ruta === "/login") {
      const ip = ipDe(req);
      if (bloqueado(ip)) return enviar(res, 429, { error: "Demasiados intentos. Espera 5 minutos." });
      const { usuario: nombre, clave } = await leerCuerpo(req);
      const u = usuarioPorNombre(nombre);
      if (!u || !verificarClave(String(clave || ""), u.hash)) { falla(ip); return enviar(res, 401, { error: "Usuario o contraseña incorrectos." }); }
      intentos.delete(ip);
      return enviar(res, 200, emitirToken(u));
    }

    // protegidas
    const auth = String(req.headers.authorization || "");
    let sesion = auth.startsWith("Bearer ") ? validarToken(auth.slice(7)) : null;
    // La sesión debe corresponder a un usuario que siga activo (un token anterior a las facultades no trae uid)
    const usuarioSesion = sesion && sesion.uid ? usuarioPorId(sesion.uid) : null;
    if (!usuarioSesion || !usuarioSesion.activo) return enviar(res, 401, { error: "Sesión no válida o vencida." });
    sesion = { ...sesion, rol: usuarioSesion.rol, fac: usuarioSesion.fac, facultad: usuarioSesion.facultad };
    const esAdmin = sesion.rol === "admin";

    if (m === "POST" && ruta === "/cambiar-clave") {
      const { actual, nueva } = await leerCuerpo(req);
      const u = usuarioSesion;
      if (!verificarClave(String(actual || ""), u.hash)) return enviar(res, 400, { error: "La contraseña actual no es correcta." });
      if (!nueva || String(nueva).length < 8) return enviar(res, 400, { error: "La contraseña nueva debe tener al menos 8 caracteres." });
      db.prepare("UPDATE usuarios SET hash = ? WHERE id = ?").run(hashClave(String(nueva)), u.id);
      return enviar(res, 200, { ok: true });
    }

    /* ---------- administración de usuarios (solo el administrador) ---------- */
    if (ruta === "/yo" && m === "GET") return enviar(res, 200, { usuario: sesion.sub, rol: sesion.rol, fac: sesion.fac, facultad: sesion.facultad, color: colorDe(sesion.fac) });
    if (ruta.startsWith("/usuarios")) {
      if (!esAdmin) return enviar(res, 403, { error: "Solo el administrador puede gestionar usuarios." });
      if (ruta === "/usuarios" && m === "GET") {
        const filas = db.prepare("SELECT id, nombre, rol, fac, facultad, activo, creado FROM usuarios ORDER BY facultad, nombre").all();
        return enviar(res, 200, { usuarios: filas.map((u) => ({ ...u, color: colorDe(u.fac) })) });
      }
      if (ruta === "/usuarios" && m === "POST") {
        const { nombre, clave, facultad, color } = await leerCuerpo(req);
        const n = String(nombre || "").trim(), fNombre = String(facultad || "").trim();
        if (n.length < 3) return enviar(res, 400, { error: "El usuario debe tener al menos 3 caracteres." });
        if (!clave || String(clave).length < 8) return enviar(res, 400, { error: "La contraseña debe tener al menos 8 caracteres." });
        const fac = slugFacultad(fNombre);
        if (fNombre.length < 3 || !fac) return enviar(res, 400, { error: "Escribe el nombre de la facultad." });
        if (db.prepare("SELECT 1 FROM usuarios WHERE nombre = ?").get(n)) return enviar(res, 409, { error: "Ya existe un usuario con ese nombre." });
        // Si la facultad ya existe se conserva su nombre oficial; si es nueva, se guarda como se escribió
        const existente = db.prepare("SELECT facultad FROM usuarios WHERE fac = ? LIMIT 1").get(fac);
        const nombreFac = fac === FAC_ORIGINAL ? NOMBRE_FAC_ORIGINAL : existente ? existente.facultad : fNombre;
        if (color && !COLOR_HEX.test(String(color))) return enviar(res, 400, { error: "El color debe ser un código como #1A171B." });
        const r = db.prepare("INSERT INTO usuarios (nombre, hash, rol, fac, facultad, creado) VALUES (?, ?, 'facultad', ?, ?, ?)").run(n, hashClave(String(clave)), fac, nombreFac, new Date().toISOString());
        if (color && !existente && fac !== FAC_ORIGINAL) setMeta(`fac-color:${fac}`, String(color));
        return enviar(res, 200, { id: Number(r.lastInsertRowid), nombre: n, fac, facultad: nombreFac, color: colorDe(fac) });
      }
      if (ruta === "/usuarios/color" && m === "POST") {
        const { fac, color } = await leerCuerpo(req);
        if (!COLOR_HEX.test(String(color || ""))) return enviar(res, 400, { error: "El color debe ser un código como #1A171B." });
        if (!db.prepare("SELECT 1 FROM usuarios WHERE fac = ? LIMIT 1").get(String(fac || ""))) return enviar(res, 404, { error: "No existe esa facultad." });
        setMeta(`fac-color:${fac}`, String(color));
        return enviar(res, 200, { fac, color: String(color) });
      }
      const mu = ruta.match(/^\/usuarios\/(\d+)\/(clave|activo)$/);
      if (mu && m === "POST") {
        const objetivo = usuarioPorId(Number(mu[1]));
        if (!objetivo) return enviar(res, 404, { error: "No existe ese usuario." });
        const cuerpo = await leerCuerpo(req);
        if (mu[2] === "clave") {
          if (!cuerpo.nueva || String(cuerpo.nueva).length < 8) return enviar(res, 400, { error: "La contraseña nueva debe tener al menos 8 caracteres." });
          db.prepare("UPDATE usuarios SET hash = ? WHERE id = ?").run(hashClave(String(cuerpo.nueva)), objetivo.id);
        } else {
          if (objetivo.id === usuarioSesion.id) return enviar(res, 400, { error: "No puedes desactivar tu propia cuenta." });
          db.prepare("UPDATE usuarios SET activo = ? WHERE id = ?").run(cuerpo.activo ? 1 : 0, objetivo.id);
        }
        return enviar(res, 200, { ok: true });
      }
      return enviar(res, 404, { error: "Ruta no encontrada." });
    }

    if (ruta === "/storage" && m === "GET") {
      const prefijo = url.searchParams.get("prefix") || "";
      const filas = db.prepare("SELECT key FROM kv WHERE key LIKE ? ESCAPE '\\' ORDER BY key").all((prefijoFac(sesion) + prefijo).replace(/[\\%_]/g, "\\$&") + "%");
      // la facultad original no ve las claves que pertenecen a otras facultades
      const propias = filas.map((f) => f.key).filter((k) => prefijoFac(sesion) || !k.startsWith("fac:"));
      return enviar(res, 200, { keys: propias.map((k) => claveVisible(sesion, k)), prefix: prefijo });
    }
    const mk = ruta.match(/^\/storage\/(.+)$/);
    if (mk) {
         let key;
   try { key = decodeURIComponent(mk[1]); } catch (e) { return enviar(res, 400, { error: "Clave inválida." }); }
      if (key.length > 200) return enviar(res, 400, { error: "Clave demasiado larga." });
      if (key.startsWith("fac:")) return enviar(res, 400, { error: "Clave inválida." });
      key = claveReal(sesion, key);
      if (m === "GET") {
        const f = db.prepare("SELECT value FROM kv WHERE key = ?").get(key);
        return f ? enviar(res, 200, { key: claveVisible(sesion, key), value: f.value }) : enviar(res, 404, { error: "No existe." });
      }
      if (m === "PUT") {
        const { value } = await leerCuerpo(req);
        if (typeof value !== "string") return enviar(res, 400, { error: "Falta el valor." });
        const dia = new Date().toISOString().slice(0, 10);
        db.exec("BEGIN");
        try {
          // copia diaria del estado anterior (la primera escritura del día guarda cómo estaba)
          db.prepare("INSERT OR IGNORE INTO respaldos (dia, key, value) SELECT ?, key, value FROM kv WHERE key = ?").run(dia, key);
          db.prepare("DELETE FROM respaldos WHERE dia < date('now', '-30 day')").run();
          db.prepare("INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").run(key, value, new Date().toISOString());
          db.exec("COMMIT");
        } catch (e) { db.exec("ROLLBACK"); throw e; }
        return enviar(res, 200, { key: claveVisible(sesion, key) });
      }
      if (m === "DELETE") {
        const r = db.prepare("DELETE FROM kv WHERE key = ?").run(key);
        return enviar(res, 200, { key: claveVisible(sesion, key), deleted: r.changes > 0 });
      }
    }

    if (m === "GET" && ruta === "/respaldo") {
      const kv = {};
      const todo = esAdmin && url.searchParams.get("todo") === "1"; // el administrador puede pedir el respaldo de todas las facultades
      for (const f of db.prepare("SELECT key, value FROM kv").all()) {
        if (todo) kv[f.key] = f.value;
        else if (prefijoFac(sesion) ? f.key.startsWith(prefijoFac(sesion)) : !f.key.startsWith("fac:")) kv[claveVisible(sesion, f.key)] = f.value;
      }
      const nombre = `gops-respaldo-${todo ? "todas-" : ""}${new Date().toISOString().slice(0, 10)}.json`;
      return enviar(res, 200, { app: "GOPS", fecha: new Date().toISOString(), kv }, { "Content-Disposition": `attachment; filename="${nombre}"` });
    }

    if (m === "GET" && ruta === "/ia/estado") return enviar(res, 200, { activa: !!iaActiva(), proveedor: IA.proveedor, modelo: iaActiva() ? modeloIA() : null });
    if (m === "GET" && ruta === "/ia/probar") {
      if (!iaActiva()) return enviar(res, 200, { ok: false, mensaje: "La IA no está configurada en el servidor (falta IA_PROVIDER e IA_API_KEY en el archivo .env)." });
      let r;
      r = await llamarIA({ max_tokens: 40, messages: [{ role: "user", content: [{ type: "text", text: "Responde solo con la palabra OK." }] }] });
      if (r.status === 200 && r.json && r.json.content) return enviar(res, 200, { ok: true, proveedor: IA.proveedor, modelo: modeloIA(), respuesta: (r.json.content[0] && r.json.content[0].text || "").slice(0, 80) });
      const detalle = (r.json && r.json.error && (r.json.error.message || r.json.error)) || `HTTP ${r.status}`;
      return enviar(res, 200, { ok: false, proveedor: IA.proveedor, modelo: modeloIA(), mensaje: String(detalle).slice(0, 300) });
    }
    if (m === "POST" && ruta === "/ia") {
      if (!iaActiva()) return enviar(res, 501, { type: "error", error: { type: "not_configured", message: "La IA no está configurada en el servidor. Los demás módulos funcionan normalmente." } });
      const cuerpo = await leerCuerpo(req);
      if (!Array.isArray(cuerpo.messages)) return enviar(res, 400, { error: { message: "Solicitud inválida." } });
      let r;
      r = await llamarIA(cuerpo);
      return enviar(res, r.status, r.json || { error: { message: "Respuesta vacía del proveedor." } });
    }

    return enviar(res, 404, { error: "Ruta no encontrada." });
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    enviar(res, status, { error: status === 500 ? "Error interno." : e.message });
  }
});
servidor.listen(PORT, "0.0.0.0", () => console.log(`GOPS backend en :${PORT} · IA: ${iaActiva() ? `${IA.proveedor} (${modeloIA()})` : "desactivada"}`));
   module.exports = { servidor, hashClave, verificarClave, firmar, validarToken, ipDe };
