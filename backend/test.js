const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const S = require("os").tmpdir() + require("path").sep;
let fallos = 0; const chk = (n, c, d = "") => { if (!c) fallos++; console.log(c ? "OK  " : "FALLA", n, d); };
// proveedores falsos para probar la traducción
const falsos = http.createServer((req, res) => {
  let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => {
    const j = JSON.parse(b || "{}"); res.setHeader("Content-Type", "application/json");
    if (req.url.startsWith("/v1/messages")) return res.end(JSON.stringify({ content: [{ type: "text", text: "anthropic:" + j.model + ":" + req.headers["x-api-key"] }] }));
    if (req.url.startsWith("/v1/chat/completions")) { const tipos = j.messages[0].content.map((c) => c.type).join(","); return res.end(JSON.stringify({ choices: [{ message: { content: "openai:" + j.model + ":" + tipos + ":" + req.headers.authorization } }] })); }
    if (req.url.includes(":generateContent")) { const p = j.contents[0].parts.map((x) => (x.text !== undefined ? "t" : "i")).join(""); return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: "gemini:" + req.url.split("/models/")[1].split(":")[0] + ":" + p + ":" + req.headers["x-goog-api-key"] }] } }] })); }
    res.statusCode = 404; res.end("{}");
  });
}).listen(9911);
const arranca = (env, port) => new Promise((ok) => {
  const db = S + "t" + port + ".db"; try { fs.unlinkSync(db); } catch (e) {}
  const p = spawn("node", ["backend/server.js"], { env: { ...process.env, PORT: port, DB_PATH: db, ...env }, stdio: ["ignore", "pipe", "inherit"] });
  p.stdout.on("data", (d) => { if (String(d).includes("backend en")) ok(p); });
});
const api = async (port, m, ruta, cuerpo, token) => {
  const r = await fetch(`http://localhost:${port}${ruta}`, { method: m, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  let j = null; try { j = await r.json(); } catch (e) {} return { s: r.status, j };
};
(async () => {
  const p = await arranca({}, 3101);
  let r = await api(3101, "GET", "/gops/api/estado"); chk("estado sin usuario (con prefijo /gops/api)", r.j.hayUsuario === false);
  r = await api(3101, "GET", "/api/storage?prefix="); chk("sin sesión → 401", r.s === 401);
  r = await api(3101, "POST", "/api/configurar", { usuario: "carolina", clave: "corta" }); chk("clave corta rechazada", r.s === 400);
  r = await api(3101, "POST", "/api/configurar", { usuario: "carolina", clave: "Clave-Segura-1" }); chk("configurar cuenta", r.s === 200 && r.j.token);
  const t0 = r.j.token;
  r = await api(3101, "POST", "/api/configurar", { usuario: "otro", clave: "Clave-Segura-2" }); chk("no se puede reconfigurar", r.s === 409);
  r = await api(3101, "POST", "/api/login", { usuario: "carolina", clave: "mala" }); chk("login incorrecto 401", r.s === 401);
  r = await api(3101, "POST", "/api/login", { usuario: "carolina", clave: "Clave-Segura-1" }); chk("login correcto", r.s === 200); const t = r.j.token;
  r = await api(3101, "PUT", "/api/storage/ops-app-state-v1", { value: JSON.stringify({ records: [1, 2, 3] }) }, t); chk("guardar", r.s === 200);
  r = await api(3101, "GET", "/api/storage/ops-app-state-v1", null, t); chk("leer", JSON.parse(r.j.value).records.length === 3);
  await api(3101, "PUT", "/api/storage/ops-app-state-v1", { value: JSON.stringify({ records: [1] }) }, t);
  r = await api(3101, "GET", "/api/storage?prefix=ops", null, t); chk("listar por prefijo", r.j.keys.join() === "ops-app-state-v1");
  r = await api(3101, "GET", "/api/respaldo", null, t); chk("respaldo descargable", JSON.parse(r.j.kv["ops-app-state-v1"]).records.length === 1);
  r = await api(3101, "GET", "/api/storage/no-existe", null, t); chk("clave inexistente 404", r.s === 404);
  r = await api(3101, "POST", "/api/cambiar-clave", { actual: "x", nueva: "Nueva-Clave-22" }, t); chk("cambiar clave exige la actual", r.s === 400);
  r = await api(3101, "POST", "/api/cambiar-clave", { actual: "Clave-Segura-1", nueva: "Nueva-Clave-22" }, t); chk("cambiar clave", r.s === 200);
  r = await api(3101, "POST", "/api/login", { usuario: "carolina", clave: "Nueva-Clave-22" }); chk("login con clave nueva", r.s === 200);
  r = await api(3101, "POST", "/api/ia", { messages: [] }, t); chk("IA sin configurar → 501 sin reintentos", r.s === 501 && /no está configurada/.test(r.j.error.message));
  for (let i = 0; i < 5; i++) await api(3101, "POST", "/api/login", { usuario: "carolina", clave: "mala" });
  r = await api(3101, "POST", "/api/login", { usuario: "carolina", clave: "Nueva-Clave-22" }); chk("bloqueo tras 5 intentos", r.s === 429);
  r = await api(3101, "GET", "/api/storage?prefix=", null, "token.falso.xx"); chk("token falso rechazado", r.s === 401);
  p.kill();
  // reinicio: los datos persisten
  const p2 = await new Promise((ok) => { const q = spawn("node", ["backend/server.js"], { env: { ...process.env, PORT: 3101, DB_PATH: S + "t3101.db" }, stdio: ["ignore", "pipe", "inherit"] }); q.stdout.on("data", (d) => String(d).includes("backend en") && ok(q)); });
  r = await api(3101, "POST", "/api/login", { usuario: "carolina", clave: "Nueva-Clave-22" }); chk("tras reiniciar, la cuenta persiste", r.s === 200);
  r = await api(3101, "GET", "/api/storage/ops-app-state-v1", null, r.j.token); chk("tras reiniciar, los datos persisten", r.s === 200);
  p2.kill();
  // IA con cada proveedor (servidores falsos)
  const msg = { max_tokens: 100, messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: "AAA" } }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "BBB" } }, { type: "text", text: "hola" }] }] };
  for (const [prov, esperado, puerto] of [["anthropic", "anthropic:claude-sonnet-4-6:LLAVE", 3102], ["openai", "openai:gpt-4o:file,image_url,text:Bearer LLAVE", 3103], ["gemini", "gemini:gemini-3.8-flash:iit:LLAVE", 3104]]) {
    const q = await arranca({ IA_PROVIDER: prov, IA_API_KEY: "LLAVE", IA_BASE_URL: "http://localhost:9911" }, puerto);
    let x = await api(puerto, "POST", "/api/configurar", { usuario: "carolina", clave: "Clave-Segura-1" }); 
    x = await api(puerto, "POST", "/api/ia", msg, x.j.token);
    chk("IA " + prov + " traduce y responde en formato común", x.s === 200 && x.j.content[0].text === esperado, JSON.stringify(x.j).slice(0, 120));
    q.kill();
  }
  { const q = await arranca({ IA_PROVIDER: "openai", IA_API_KEY: "LLAVE", IA_BASE_URL: "http://localhost:9911" }, 3105);
    let x = await api(3105, "POST", "/api/configurar", { usuario: "carolina", clave: "Clave-Segura-1" });
    x = await api(3105, "GET", "/api/ia/probar", null, x.j.token); chk("probar IA responde ok", x.j.ok === true && /openai/.test(x.j.respuesta), JSON.stringify(x.j).slice(0,100)); q.kill();
    const q2 = await arranca({}, 3106); let y = await api(3106, "POST", "/api/configurar", { usuario: "carolina", clave: "Clave-Segura-1" });
    y = await api(3106, "GET", "/api/ia/probar", null, y.j.token); chk("probar IA sin configurar explica qué falta", y.j.ok === false && /\.env/.test(y.j.mensaje)); q2.kill(); }
  falsos.close(); console.log(fallos ? fallos + " FALLOS" : "Todas las pruebas del backend pasaron"); process.exit(fallos ? 1 : 0);
})();
