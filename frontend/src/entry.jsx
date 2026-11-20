import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

/* ---------- acceso a la API (ruta relativa: funciona bajo /gops/) ---------- */
const TOKEN_KEY = "gops-token";
const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } };
const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) { /* sin almacenamiento */ } if (typeof temaDeSesion === "function") temaDeSesion(); };
let alVencerSesion = () => {};

// Datos de la sesión (usuario, rol y facultad), leídos del token. El servidor es quien valida: esto solo sirve para mostrarlos.
function sesionActual() {
  try {
    const p = getToken().split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const j = JSON.parse(decodeURIComponent(escape(atob(p + "=".repeat((4 - (p.length % 4)) % 4)))));
    return { usuario: j.sub, rol: j.rol, fac: j.fac, facultad: j.facultad, color: j.color };
  } catch (e) { return null; }
}
window.__gopsSesion = sesionActual;

/* ---------- tema: negro y naranja de la USB + color de cada facultad ---------- */
const mezclar = (hex, con, p) => { const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); const b = [1, 3, 5].map((i) => parseInt(con.slice(i, i + 2), 16)); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * p).toString(16).padStart(2, "0")).join(""); };
export function aplicarTema(color) {
  const c = /^#[0-9a-fA-F]{6}$/.test(color || "") ? color : "#1A171B";
  const st = document.documentElement.style;
  const oscuro = mezclar(c, "#000000", 0.38);
  st.setProperty("--fac", c);
  st.setProperty("--fac-dark", oscuro);
  st.setProperty("--fac-2", mezclar(c, "#FFFFFF", c.toLowerCase() === "#1a171b" ? 0.22 : 0.3));
  st.setProperty("--fac-rgb", [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)).join(","));
  st.setProperty("--brand-soft", mezclar(c, "#FFFFFF", 0.92));
}
const temaDeSesion = () => { try { aplicarTema((sesionActual() || {}).color); } catch (e) { /* sin sesión */ } };
temaDeSesion();

async function api(metodo, ruta, cuerpo) {
  const r = await fetch(`api/${ruta}`, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  let json = null;
  try { json = await r.json(); } catch (e) { /* sin cuerpo */ }
  if (r.status === 401 && getToken()) { setToken(""); alVencerSesion(); }
  return { status: r.status, ok: r.ok, json };
}

// La IA de la app pide /api/ia con el token de sesión
window.__gopsAuth = () => (getToken() ? { Authorization: `Bearer ${getToken()}` } : {});

// window.storage: misma interfaz que usa la app, ahora contra el servidor.
// Migración automática: si el servidor aún no tiene datos y este navegador guardó datos de la versión anterior, se suben.
window.storage = {
  async get(key) {
    const r = await api("GET", `storage/${encodeURIComponent(key)}`);
    if (r.ok) return { key, value: r.json.value, shared: false };
    if (r.status === 404) {
      let local = null;
      // Los datos guardados en este navegador por la versión antigua solo se suben a la facultad original
      try { local = (sesionActual() || {}).fac === "ingenieria" ? localStorage.getItem(`gops:${key}`) : null; } catch (e) { /* sin almacenamiento */ }
      if (local) {
        const s = await api("PUT", `storage/${encodeURIComponent(key)}`, { value: local });
        if (s.ok) { try { localStorage.setItem(`gops-migrado:${key}`, local); localStorage.removeItem(`gops:${key}`); } catch (e) { /* ignora */ } return { key, value: local, shared: false }; }
      }
      return null;
    }
    throw new Error(`No se pudo leer (${r.status})`);
  },
  async set(key, value) {
    const r = await api("PUT", `storage/${encodeURIComponent(key)}`, { value: String(value) });
    if (!r.ok) throw new Error(`No se pudo guardar (${r.status})`);
    return { key, value: String(value), shared: false };
  },
  async delete(key) {
    const r = await api("DELETE", `storage/${encodeURIComponent(key)}`);
    return { key, deleted: !!(r.json && r.json.deleted), shared: false };
  },
  async list(prefix = "") {
    const r = await api("GET", `storage?prefix=${encodeURIComponent(prefix)}`);
    return { keys: (r.json && r.json.keys) || [], prefix, shared: false };
  },
};

/* ---------- pantalla de ingreso ---------- */
const est = {
  fondo: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden", fontFamily: "'Figtree Variable', system-ui, sans-serif", background: "linear-gradient(175deg, #100E11 0%, #1A171B 60%, #3A353C 100%)" },
  tarjeta: { position: "relative", boxSizing: "border-box", background: "#fff", borderRadius: 20, padding: "30px 28px", width: "100%", maxWidth: 400, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" },
  marcaAgua: { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%) rotate(-14deg)", fontFamily: "'Bricolage Grotesque Variable', sans-serif", fontWeight: 800, fontSize: "clamp(160px, 38vw, 520px)", letterSpacing: "0.04em", color: "rgba(255,255,255,0.06)", userSelect: "none", pointerEvents: "none", whiteSpace: "nowrap", lineHeight: 1 },
  relieve: { position: "relative", margin: 0, fontFamily: "'Bricolage Grotesque Variable', sans-serif", fontWeight: 800, fontSize: "clamp(64px, 15vw, 132px)", letterSpacing: "0.12em", lineHeight: 1, color: "#EB8600", textShadow: "-2px -2px 1px rgba(255,255,255,0.55), 2px 2px 3px rgba(0,0,0,0.55), 0 14px 28px rgba(15,8,50,0.5)" },
  lema: { position: "relative", marginTop: 8, marginBottom: 26, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.88)", letterSpacing: 0.4, textAlign: "center" },
  campo: { width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 10, border: "1px solid #CFCBE3", fontSize: 14, fontFamily: "inherit", marginTop: 4 },
  boton: { width: "100%", marginTop: 18, padding: "12px", borderRadius: 11, border: "none", background: "#EB8600", color: "#1A171B", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
};

function Ingreso({ modo, onListo }) {  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [claveInst, setClaveInst] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const crear = modo === "crear";

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (crear && clave !== clave2) { setError("Las dos contraseñas no coinciden."); return; }
    setOcupado(true);
    try {
      const r = await api("POST", crear ? "configurar" : "login", { usuario, clave, claveInstalacion: claveInst });
      if (r.ok) { setToken(r.json.token); onListo(); }
      else setError((r.json && r.json.error) || `No se pudo ingresar (${r.status}).`);
    } catch (err) {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.");
    } finally { setOcupado(false); }
  }

  return (
    <div style={est.fondo}>
      {/* marca de agua */}
      <div aria-hidden="true" style={est.marcaAgua}>GOPS</div>
      {/* nombre grande en alto relieve */}
      <h1 style={est.relieve}>GOPS</h1>
      <div style={est.lema}>Gestión de OPS y Bonificaciones de Posgrados</div>
      <form onSubmit={enviar} style={est.tarjeta}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1B1740" }}>{crear ? "Crea tu cuenta de acceso" : "Iniciar sesión"}</div>
        {crear && <div style={{ fontSize: 12.5, color: "#5A5678", marginTop: 4 }}>Es la primera vez que se abre GOPS en este servidor. Elige un usuario y una contraseña de al menos 8 caracteres.</div>}
        <label style={{ display: "block", marginTop: 14, fontSize: 12.5, fontWeight: 600, color: "#3B3760" }}>Usuario
          <input style={est.campo} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label style={{ display: "block", marginTop: 12, fontSize: 12.5, fontWeight: 600, color: "#3B3760" }}>Contraseña
          <input style={est.campo} type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete={crear ? "new-password" : "current-password"} />
        </label>
        {crear && (
          <label style={{ display: "block", marginTop: 12, fontSize: 12.5, fontWeight: 600, color: "#3B3760" }}>Repite la contraseña
            <input style={est.campo} type="password" value={clave2} onChange={(e) => setClave2(e.target.value)} autoComplete="new-password" />
          </label>
        )}
           {crear && (
     <label style={{ display: "block", marginTop: 12, fontSize: 12.5, fontWeight: 600, color: "#3B3760" }}>Clave de instalación (si el administrador del servidor la definió)
       <input style={est.campo} type="password" value={claveInst} onChange={(e) => setClaveInst(e.target.value)} autoComplete="off" />
     </label>
   )}
        {error && <div style={{ marginTop: 12, fontSize: 12.5, color: "#B42318" }}>{error}</div>}
        <button type="submit" disabled={ocupado || !usuario || !clave} style={{ ...est.boton, opacity: ocupado || !usuario || !clave ? 0.6 : 1 }}>{ocupado ? "Un momento…" : crear ? "Crear cuenta y entrar" : "Entrar"}</button>
      </form>
    </div>
  );
}

/* ---------- gestión de usuarios y facultades (solo administrador) ---------- */
function GestionUsuarios({ onCerrar }) {
  const [lista, setLista] = useState([]);
  const [msg, setMsg] = useState("");
  const [nuevo, setNuevo] = useState({ nombre: "", clave: "", facultad: "", color: "#1A171B" });
  const [reset, setReset] = useState({ id: null, nueva: "" });

  async function cargar() {
    const r = await api("GET", "usuarios");
    if (r.ok) setLista(r.json.usuarios); else setMsg((r.json && r.json.error) || "No se pudo cargar la lista.");
  }
  useEffect(() => { cargar(); }, []);
  async function crear(e) {
    e.preventDefault();
    const r = await api("POST", "usuarios", nuevo);
    if (r.ok) { setMsg(`Usuario creado: ${r.json.nombre} (${r.json.facultad}).`); setNuevo({ nombre: "", clave: "", facultad: "", color: "#1A171B" }); cargar(); }
    else setMsg((r.json && r.json.error) || "No se pudo crear el usuario.");
  }
  async function cambiarClave(id) {
    const r = await api("POST", `usuarios/${id}/clave`, { nueva: reset.nueva });
    if (r.ok) { setMsg("Contraseña restablecida."); setReset({ id: null, nueva: "" }); } else setMsg((r.json && r.json.error) || "No se pudo restablecer.");
  }
  async function cambiarColor(u, color) {
    const r = await api("POST", "usuarios/color", { fac: u.fac, color });
    if (r.ok) { if ((sesionActual() || {}).fac === u.fac) aplicarTema(color); setMsg(`Color de ${u.facultad} actualizado.`); cargar(); } else setMsg((r.json && r.json.error) || "No se pudo cambiar el color.");
  }
  async function activar(u) {
    const r = await api("POST", `usuarios/${u.id}/activo`, { activo: !u.activo });
    if (r.ok) cargar(); else setMsg((r.json && r.json.error) || "No se pudo cambiar el estado.");
  }
  const facultades = [...new Set(lista.map((u) => u.facultad))];
  const mini = { border: "1px solid #CFCBE3", background: "#fff", borderRadius: 8, padding: "5px 9px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Figtree Variable', system-ui, sans-serif" }}>
      <div onClick={onCerrar} style={{ position: "absolute", inset: 0, background: "rgba(27,23,64,0.5)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 16, padding: 22, width: 620, maxWidth: "100%", maxHeight: "90dvh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>Usuarios y facultades</div>
          <button onClick={onCerrar} style={mini}>Cerrar</button>
        </div>
        <div style={{ fontSize: 12.5, color: "#5A5678", marginTop: 4 }}>Cada facultad tiene sus propios registros, programas y tarifas, y empieza vacía. Un usuario solo ve los datos de su facultad.</div>
        <form onSubmit={crear} style={{ marginTop: 14, background: "#F4F2FB", borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Crear usuario</div>
          <input placeholder="Usuario (mín. 3 caracteres)" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} autoComplete="off" style={{ ...est.campo, marginTop: 0, fontSize: 13 }} />
          <input type="password" placeholder="Contraseña (mín. 8)" value={nuevo.clave} onChange={(e) => setNuevo({ ...nuevo, clave: e.target.value })} autoComplete="new-password" style={{ ...est.campo, fontSize: 13 }} />
          <input list="facultades-gops" placeholder="Facultad (ej.: Facultad de Arquitectura)" value={nuevo.facultad} onChange={(e) => setNuevo({ ...nuevo, facultad: e.target.value })} style={{ ...est.campo, fontSize: 13 }} />
          <datalist id="facultades-gops">{facultades.map((f) => <option key={f} value={f} />)}</datalist>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12.5, color: "#3B3760" }}>Color de la facultad
            <input type="color" value={nuevo.color || "#1A171B"} onChange={(e) => setNuevo({ ...nuevo, color: e.target.value })} style={{ width: 38, height: 26, padding: 0, border: "1px solid #CFCBE3", borderRadius: 6 }} />
            <span style={{ fontSize: 11.5, color: "#5A5678" }}>(solo se usa si la facultad es nueva)</span>
          </label>
          <button type="submit" disabled={!nuevo.nombre || !nuevo.clave || !nuevo.facultad} style={{ ...est.boton, marginTop: 10, padding: 9, fontSize: 13, opacity: !nuevo.nombre || !nuevo.clave || !nuevo.facultad ? 0.6 : 1 }}>Crear usuario</button>
        </form>
        {msg && <div style={{ fontSize: 12.5, color: "#3B3760", margin: "10px 2px 0" }}>{msg}</div>}
        <div style={{ marginTop: 14 }}>
          {lista.map((u) => (
            <div key={u.id} style={{ borderTop: "1px solid #E4E1F2", padding: "9px 2px", opacity: u.activo ? 1 : 0.55 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div><b style={{ fontSize: 13.5 }}>{u.nombre}</b> <span style={{ fontSize: 12, color: "#5A5678" }}>· {u.facultad}{u.rol === "admin" ? " · administrador" : ""}{u.activo ? "" : " · desactivado"}</span></div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="color" title={`Color de ${u.facultad}`} value={u.color || "#1A171B"} onChange={(e) => cambiarColor(u, e.target.value)} style={{ width: 30, height: 26, padding: 0, border: "1px solid #CFCBE3", borderRadius: 6, cursor: "pointer" }} />
                  <button style={mini} onClick={() => setReset(reset.id === u.id ? { id: null, nueva: "" } : { id: u.id, nueva: "" })}>Restablecer contraseña</button>
                  {u.nombre !== (sesionActual() || {}).usuario && <button style={mini} onClick={() => activar(u)}>{u.activo ? "Desactivar" : "Activar"}</button>}
                </div>
              </div>
              {reset.id === u.id && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input type="password" placeholder="Contraseña nueva (mín. 8)" value={reset.nueva} onChange={(e) => setReset({ ...reset, nueva: e.target.value })} style={{ ...est.campo, marginTop: 0, fontSize: 13 }} />
                  <button style={{ ...mini, background: "#1A171B", color: "#fff", borderColor: "#1A171B" }} onClick={() => cambiarClave(u.id)}>Guardar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- menú de cuenta (cambiar contraseña, respaldo, salir) ---------- */
function MenuCuenta({ onSalir }) {
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState("menu");
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [msg, setMsg] = useState("");
  const [usuarios, setUsuarios] = useState(false);
  const ses = sesionActual() || {};

  async function descargar(todo) {
    const r = await fetch(`api/respaldo${todo ? "?todo=1" : ""}`, { headers: window.__gopsAuth() });
    if (!r.ok) { setMsg("No se pudo generar el respaldo."); return; }
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gops-respaldo-${todo ? "todas-" : ""}${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setMsg("Respaldo descargado.");
  }
  async function probarIA() {
    setMsg("Probando la IA…");
    try {
      const r = await api("GET", "ia/probar");
      if (r.ok && r.json.ok) setMsg(`IA funcionando (${r.json.proveedor}, ${r.json.modelo}).`);
      else setMsg((r.json && r.json.mensaje) || "La IA no respondió.");
    } catch (err) { setMsg("No se pudo conectar con el servidor."); }
  }
  async function cambiar(e) {
    e.preventDefault();
    const r = await api("POST", "cambiar-clave", { actual, nueva });
    if (r.ok) { setMsg("Contraseña cambiada."); setVista("menu"); setActual(""); setNueva(""); }
    else setMsg((r.json && r.json.error) || "No se pudo cambiar.");
  }
  const bt = { display: "block", width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "none", fontSize: 13, cursor: "pointer", fontFamily: "inherit", borderRadius: 8 };

  return (
    <div style={{ position: "fixed", top: 10, right: 12, zIndex: 80, fontFamily: "'Figtree Variable', system-ui, sans-serif" }}>
      <button onClick={() => { setAbierto(!abierto); setMsg(""); setVista("menu"); }} style={{ border: "1px solid #CFCBE3", background: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>Cuenta ▾</button>
      {abierto && (
        <div style={{ marginTop: 6, background: "#fff", border: "1px solid #E4E1F2", borderRadius: 12, padding: 8, width: 230, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
          {vista === "menu" ? (
            <>
              <div style={{ padding: "4px 10px 8px", fontSize: 12, color: "#5A5678", borderBottom: "1px solid #E4E1F2", marginBottom: 4 }}><b style={{ color: "#1B1740" }}>{ses.usuario}</b><br />{ses.facultad}</div>
              <button style={bt} onClick={() => descargar(false)}>Descargar respaldo de datos</button>
              {ses.rol === "admin" && <button style={bt} onClick={() => descargar(true)}>Respaldo de todas las facultades</button>}
              {ses.rol === "admin" && <button style={bt} onClick={() => { setUsuarios(true); setAbierto(false); }}>Usuarios y facultades</button>}
              <button style={bt} onClick={probarIA}>Probar conexión con la IA</button>
              <button style={bt} onClick={() => { setVista("clave"); setMsg(""); }}>Cambiar contraseña</button>
              <button style={{ ...bt, color: "#B42318" }} onClick={() => { setToken(""); onSalir(); }}>Cerrar sesión</button>
            </>
          ) : (
            <form onSubmit={cambiar} style={{ padding: 4 }}>
              <input type="password" placeholder="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)} style={{ ...est.campo, marginTop: 0, fontSize: 13 }} />
              <input type="password" placeholder="Contraseña nueva (mín. 8)" value={nueva} onChange={(e) => setNueva(e.target.value)} style={{ ...est.campo, fontSize: 13 }} />
              <button type="submit" style={{ ...est.boton, marginTop: 10, padding: 9, fontSize: 13 }}>Guardar</button>
            </form>
          )}
          {msg && <div style={{ fontSize: 12, padding: "6px 10px", color: "#3B3760" }}>{msg}</div>}
        </div>
      )}
      {usuarios && <GestionUsuarios onCerrar={() => setUsuarios(false)} />}
    </div>
  );
}

function Raiz() {
  const [fase, setFase] = useState("cargando"); // cargando | crear | login | app | error
  const [clave, setClave] = useState(0);

  async function decidir() {
    try {
      if (getToken()) {
        const r = await api("GET", "storage?prefix=__ping__");
        if (r.ok) { setFase("app"); return; }
      }
      const e = await api("GET", "estado");
      if (!e.ok) throw new Error("estado");
      setFase(e.json.hayUsuario ? "login" : "crear");
    } catch (err) { setFase("error"); }
  }
  useEffect(() => { alVencerSesion = () => setFase("login"); decidir(); }, []);

  if (fase === "cargando") return <div style={{ ...est.fondo, color: "#fff" }}>Cargando…</div>;
  if (fase === "error") return (
    <div style={est.fondo}><div style={est.tarjeta}>
      <b>No se pudo conectar con el servidor.</b>
      <div style={{ fontSize: 13, marginTop: 8, color: "#5A5678" }}>Revisa que el servidor esté encendido e inténtalo de nuevo.</div>
      <button style={est.boton} onClick={() => { setFase("cargando"); decidir(); }}>Reintentar</button>
    </div></div>
  );
  if (fase === "crear" || fase === "login") return <Ingreso modo={fase} onListo={() => { setClave((c) => c + 1); setFase("app"); }} />;
  return (<><MenuCuenta onSalir={() => setFase("login")} /><App key={clave} /></>);
}

createRoot(document.getElementById("root")).render(<Raiz />);
