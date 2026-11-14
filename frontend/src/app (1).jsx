import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  LayoutDashboard, Table2, GraduationCap, Plus, Search, X, Mail,
  AlertTriangle, Clock, CheckCircle2, ChevronRight, FileWarning,
  CircleDollarSign, FileCheck2, BellRing, Sparkles, Settings,
  Upload, Download, FileSpreadsheet, RotateCcw, Trash2, ChevronDown,
  Menu, PanelLeftClose, PanelLeftOpen, CalendarDays, TrendingUp, ClipboardList, ArrowUpDown,
  Maximize2, Minimize2, ShieldCheck
} from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/* ------------------------------------------------------------------ */
/*  TOKENS                                                             */
/* ------------------------------------------------------------------ */
const FONTS = `

`;

const TOKENS = `
:root{
  --ink:#1B1740;
  --ink-2:#4F3BC4;
  --ink-soft:#6A6785;
  --brand:#5B45D6;
  --brand-soft:#EFECFC;
  --paper:#F5F5FA;
  --paper-raised:#FFFFFF;
  --line:#E9E8F2;
  --line-strong:#D9D7E8;
  --moss:#14946A;
  --moss-soft:#E3F6EE;
  --gold:#A8782A;
  --gold-soft:#FBF1DD;
  --brick:#D6334A;
  --brick-soft:#FDE9EC;
  --amber:#D9791A;
  --amber-soft:#FEEEDB;
  --shadow-sm:0 1px 2px rgba(27,23,64,0.05);
  --shadow-md:0 6px 20px rgba(27,23,64,0.08);
  --shadow-lg:0 18px 48px rgba(27,23,64,0.16);
}
html{ -webkit-font-smoothing:antialiased; }
.font-display{font-family:'Bricolage Grotesque','Figtree',sans-serif; letter-spacing:-0.02em;}
.font-body{font-family:'Figtree',system-ui,sans-serif;}
.font-mono{font-family:'JetBrains Mono',ui-monospace,monospace; font-variant-numeric:tabular-nums;}
body,button,input,select,textarea{font-family:'Figtree',system-ui,sans-serif;}
::selection{background:var(--brand-soft); color:var(--ink);}
details > summary{list-style:none;cursor:pointer;}
details > summary::-webkit-details-marker{display:none;}
details[open] > summary{border-color:var(--brand) !important;}

/* Tablas: encabezados sobrios, filas con respuesta al pasar el cursor */
table{border-collapse:separate; border-spacing:0;}
th{text-transform:none !important; letter-spacing:0 !important; font-size:12px !important; font-weight:600 !important; color:var(--ink-soft) !important; background:#FAFAFD; text-align:left;}
td{border-bottom:1px solid var(--line);}
tbody tr{transition:background .12s ease;}
tbody tr:last-child > td{border-bottom:none;}

/* Controles */
button{transition:background-color .14s ease, border-color .14s ease, filter .14s ease, box-shadow .14s ease;}
button:not(:disabled):hover{filter:brightness(0.96);}
button:not(:disabled):active{transform:translateY(0.5px);}
input:not([type=checkbox]):not([type=radio]), select, textarea{transition:border-color .14s ease, box-shadow .14s ease;}
input:not([type=checkbox]):not([type=radio]):focus, select:focus, textarea:focus{outline:none; border-color:var(--brand) !important; box-shadow:0 0 0 3px rgba(91,69,214,0.16);}
button:focus-visible, summary:focus-visible, a:focus-visible{outline:2px solid var(--brand); outline-offset:2px;}
input[type=checkbox]{accent-color:var(--brand); width:15px; height:15px;}
*{scrollbar-width:thin; scrollbar-color:var(--line-strong) transparent;}

.ops-sidebar{transition:width .22s ease, transform .22s ease;}
.ops-hamburger{display:none;}
.ops-backdrop{display:none;}
.ops-card{transition:box-shadow .18s ease, border-color .18s ease;}
.ops-card:hover{box-shadow:var(--shadow-md); border-color:var(--line-strong);}
@keyframes ops-fade-up{ from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:translateY(0); } }
.ops-fade-in{ animation:ops-fade-up .3s ease both; }
@media (prefers-reduced-motion: reduce){ .ops-fade-in{animation:none;} *{transition:none !important;} }

/* Indicadores: una sola tira con divisores en lugar de ocho tarjetas sueltas */
.ops-kpi-grid{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
.ops-kpi{ position:relative; overflow:hidden; color:#fff; border-radius:20px; padding:18px 20px 16px; min-width:0; box-shadow:0 10px 24px rgba(27,23,64,0.14); transition:transform .18s ease, box-shadow .18s ease; }
.ops-kpi:hover{ transform:translateY(-3px); box-shadow:0 16px 32px rgba(27,23,64,0.2); }
.ops-nav-item:hover{ background:rgba(255,255,255,0.12) !important; color:#fff !important; }
@media (max-width: 700px){ .ops-arte{ display:none; } }

@media (max-width: 900px){
  .ops-sidebar{position:fixed; top:0; left:0; height:100dvh; z-index:95; width:250px !important; transform:translateX(-100%);}
  .ops-sidebar.mobile-open{transform:translateX(0); box-shadow:var(--shadow-lg);}
  .ops-hamburger{display:inline-flex !important;}
  .ops-backdrop.visible{display:block; position:fixed; inset:0; background:rgba(27,23,64,0.35); z-index:90;}
  .ops-main{padding-left:16px !important; padding-right:16px !important; padding-top:64px !important;}
  .ops-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}
  .ops-charts-grid{grid-template-columns:1fr !important;}
  .ops-cfg-grid{grid-template-columns:minmax(0,1fr) !important;}
}
@media (min-width: 901px){
  .ops-desktop-collapse{display:inline-flex !important;}
}
`;

/* ------------------------------------------------------------------ */
/*  CATÁLOGO DE PROGRAMAS (real, tomado de la hoja "Siglas")           */
/* ------------------------------------------------------------------ */
const HOY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })(); // fecha real de hoy, siempre actualizada

const PROGRAMAS_DEFAULT = [
  { sigla: "EGIP", pa: "L747", cc: "34409025", nombre: "Especialización en Gerencia Integral de Proyectos", tipo: "Especialización", coordinador: "Luis Hernando Garzón Canizales", correo: "lhgarzonc@usbcali.edu.co" },
  { sigla: "EPDS", pa: "L745", cc: "34410010", nombre: "Especialización en Procesos para el Desarrollo del Software", tipo: "Especialización", coordinador: "Iván Mauricio Cabezas Troyano", correo: "imcabezas@usbcali.edu.co" },
  { sigla: "EGPPS", pa: "L759", cc: "34430001", nombre: "Especialización en Gestión de Procesos Productivos y de Servicios", tipo: "Especialización", coordinador: "Paulo César Gómez Schouben", correo: "pcgomezs@usbcali.edu.co" },
  { sigla: "MISW", pa: "L710", cc: "34412009", nombre: "Maestría en Ingeniería de Software", tipo: "Maestría", coordinador: "Iván Mauricio Cabezas Troyano", correo: "imcabezas@usbcali.edu.co" },
  { sigla: "MTIAD", pa: "L711", cc: "34426001", nombre: "Maestría en TI y Analítica de Datos", tipo: "Maestría", coordinador: "Carlos Giovanny Hidalgo Suárez", correo: "cghidalgos@usbcali.edu.co" },
  { sigla: "MBIO", pa: "L720", cc: "34413004", nombre: "Maestría en Biotecnología", tipo: "Maestría", coordinador: "Johannes Delgado Ospina", correo: "jdelgado1@usbcali.edu.co" },
  { sigla: "MGP", pa: "L748", cc: "34421005", nombre: "Maestría en Gerencia de Proyectos", tipo: "Maestría", coordinador: "Luis Hernando Garzón Canizales", correo: "lhgarzonc@usbcali.edu.co" },
  { sigla: "PhD", pa: "L684", cc: "34434001", nombre: "Doctorado en Ingeniería", tipo: "Doctorado", coordinador: "José Fernando Valencia Murillo", correo: "jfvalenc@usbcali.edu.co" },
  { sigla: "EDCO", pa: "", cc: "", nombre: "Educación Continua (diplomados y cursos)", tipo: "EDCO", coordinador: "", correo: "" },
];

const PROGRAMA_EDCO = PROGRAMAS_DEFAULT[PROGRAMAS_DEFAULT.length - 1];

const ESTADOS = {
  OPS: ["OPS Solicitada", "OPS Elaborada", "Documentos Solicitados", "Documentos Recibidos", "Visto Bueno Director/Coordinador", "Visto Bueno Decanatura", "Enviado a OPS", "Pendiente de pago", "Pagado"],
  BONIFICACION: ["Bonificación registrada", "Curso finalizado", "Visto Bueno solicitado", "Visto Bueno recibido", "Enviado para pago", "Pagado"],
};
// Posición de un estado en su secuencia. Tolera mayúsculas, tildes y espacios (p. ej. registros importados de Excel).
function idxEstado(tipo, estado) {
  const seq = ESTADOS[tipo] || [];
  const i = seq.indexOf(estado);
  if (i >= 0) return i;
  const n = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
  return seq.findIndex((x) => n(x) === n(estado));
}

/* ------------------------------------------------------------------ */
/*  CONFIGURACIÓN Y TARIFAS (editables desde Administración)           */
/* ------------------------------------------------------------------ */
const ARL_CLASES = ["I", "II", "III"]; // clases de riesgo que se usan en GOPS (contratistas docentes)
const ARL_TARIFAS_DEFAULT = { I: 0.522, II: 1.044, III: 2.436, IV: 4.35, V: 6.96 };
const CONFIG_DEFAULT = {
  // Seguridad social de OPS: la norma (SMMLV, % y tarifas ARL) se configura POR AÑO en `normaSS`.
  arlClase: "I",
  tarifasVigentesDesde: "2026-09-01", // las tarifas de la tabla rigen para cursos que finalizan desde esta fecha
  otrosPct: 0,
  redondeoPILA: true, // aproxima cada aporte al múltiplo de $100 superior, como lo hace la PILA
  normaSS: {
    "2024": { smmlv: 1300000, ibcPct: 40, topeSmmlv: 25, saludPct: 12.5, pensionPct: 16, arl: { ...ARL_TARIFAS_DEFAULT } },
    "2025": { smmlv: 1423500, ibcPct: 40, topeSmmlv: 25, saludPct: 12.5, pensionPct: 16, arl: { ...ARL_TARIFAS_DEFAULT } },
    "2026": { smmlv: 1750905, ibcPct: 40, topeSmmlv: 25, saludPct: 12.5, pensionPct: 16, arl: { ...ARL_TARIFAS_DEFAULT } },
  },
  diasEstimadosPago: 15,
  diasAlerta: [7, 3, 1],
  usuarioActual: "Jorge",
  decanaNombre: "Maribel Amu Bolaños",
  decanaCorreo: "decano.ingenieria@usbcali.edu.co",
  documentosRequeridos: ["Cédula", "RUT", "Cuenta de cobro", "Planilla pago PILA", "OPS firmada", "Certificado bancario", "Certificación SS"],
  plantillaAsunto: "Solicitud de visto bueno – {docente} – {programa} – {modulo}",
  plantillaCuerpo: `Buen día, {coordinador}.

Amablemente solicito su colaboración con el visto bueno correspondiente para continuar con el proceso de pago de:

Docente: {docente}
Programa: {programa}
Curso / Módulo: {modulo}
Cohorte: {cohorte}
Fecha de inicio: {fechaInicio}
Fecha de finalización: {fechaFin}
Horas: {horas}
Número de OPS: {noOps}
Valor: {valor}

Agradezco su colaboración y quedo atenta a su confirmación para continuar con el proceso correspondiente.

Cordialmente,
{usuario}`,
  plantillaDecanaAsunto: "Envío de documentos para aprobación y nómina – {docente} – {programa} – {modulo}",
  plantillaDecanaCuerpo: `Buen día, Decana {decana}.

De acuerdo con el visto bueno ya emitido por el coordinador del programa, envío los documentos correspondientes de:

Docente: {docente}
Programa: {programa}
Curso / Módulo: {modulo}
Fecha de inicio: {fechaInicio}
Fecha de finalización: {fechaFin}
Tipo de vinculación: {tipoVinculacion}
Número de OPS: {noOps}
Valor: {valor}

Agradezco su aprobación para continuar con el envío a nómina.

Cordialmente,
{usuario}`,
  plantillaBonifAsunto: "Formato de bonificación por diligenciar – {modulo}",
  plantillaBonifCuerpo: `Buen día, {docente}.

El curso "{modulo}" finaliza el {fechaFin} y corresponde a una bonificación. Para continuar con el proceso de pago, le solicito amablemente diligenciar y enviar el formato de bonificación correspondiente.

Programa: {programa}
Curso / Módulo: {modulo}
Cohorte: {cohorte}
Fecha de inicio: {fechaInicio}
Fecha de finalización: {fechaFin}
Horas: {horas}
Valor: {valor}

Quedo atenta al formato diligenciado para continuar con el trámite.

Cordialmente,
{usuario}`,
  plantillaPendientesAsunto: "Documentos pendientes para su OPS – {modulo} – {programa}",
  plantillaPendientesCuerpo: `Buen día, {docente}.

Gracias por los documentos que nos ha enviado. Para continuar con el trámite de su OPS del curso "{modulo}" ({programa}), aún necesitamos los siguientes documentos:

{pendientes}

{observaciones}Quedo atenta a recibirlos para continuar con el proceso.

Cordialmente,
{usuario}`,
};

const NIVELES_ACADEMICOS = ["Especialización", "Maestría", "Doctorado", "EDCO"];
const CATEGORIAS_ESCALAFON = ["Especialización", "Maestría", "Doctorado", "Profesional / Virtual", "Otros"];

// Tarifas reales: el valor depende de DOS cosas a la vez — el tipo de programa
// (Doctorado / Maestría / Especialización / EDCO) y la categoría/escalafón del
// docente (Especialización / Maestría / Doctorado / Profesional-Virtual).
const TARIFAS_DEFAULT = [
  { id: "t1", tipoPrograma: "Doctorado", categoria: "Doctorado", valorOps: 185000, valorBonificacion: 134050 },
  { id: "t2", tipoPrograma: "Maestría", categoria: "Maestría", valorOps: 137000, valorBonificacion: 99275 },
  { id: "t3", tipoPrograma: "Maestría", categoria: "Doctorado", valorOps: 137000, valorBonificacion: 99275 },
  { id: "t4", tipoPrograma: "Especialización", categoria: "Especialización", valorOps: 124000, valorBonificacion: 89855 },
  { id: "t5", tipoPrograma: "Especialización", categoria: "Maestría", valorOps: 124000, valorBonificacion: 89855 },
  { id: "t6", tipoPrograma: "Especialización", categoria: "Doctorado", valorOps: 124000, valorBonificacion: 89855 },
  { id: "t7", tipoPrograma: "EDCO", categoria: "Profesional / Virtual", valorOps: 84000, valorBonificacion: 60870 },
  { id: "t8", tipoPrograma: "EDCO", categoria: "Especialización", valorOps: 103000, valorBonificacion: 74638 },
  { id: "t9", tipoPrograma: "EDCO", categoria: "Maestría", valorOps: 103000, valorBonificacion: 74638 },
  { id: "t10", tipoPrograma: "EDCO", categoria: "Doctorado", valorOps: 103000, valorBonificacion: 74638 },
];

// Tarifas que estuvieron vigentes antes de esta actualización — se usan solo para
// detectar filas que nadie modificó a mano y subirlas automáticamente a los nuevos
// valores, sin tocar ninguna tarifa que el usuario haya editado él mismo.
const TARIFAS_ANTERIORES = [
  { tipoPrograma: "Doctorado", categoria: "Doctorado", valorOps: 205000, valorBonificacion: 148551 },
  { tipoPrograma: "Maestría", categoria: "Maestría", valorOps: 137000, valorBonificacion: 99275 },
  { tipoPrograma: "Maestría", categoria: "Doctorado", valorOps: 165000, valorBonificacion: 119515 },
  { tipoPrograma: "Especialización", categoria: "Especialización", valorOps: 124000, valorBonificacion: 89855 },
  { tipoPrograma: "Especialización", categoria: "Maestría", valorOps: 137000, valorBonificacion: 99275 },
  { tipoPrograma: "Especialización", categoria: "Doctorado", valorOps: 165000, valorBonificacion: 119515 },
  { tipoPrograma: "EDCO", categoria: "Profesional / Virtual", valorOps: 82000, valorBonificacion: 0 },
  { tipoPrograma: "EDCO", categoria: "Especialización", valorOps: 103000, valorBonificacion: 74638 },
  { tipoPrograma: "EDCO", categoria: "Maestría", valorOps: 110000, valorBonificacion: 79710 },
  { tipoPrograma: "EDCO", categoria: "Doctorado", valorOps: 131000, valorBonificacion: 94928 },
];

function actualizarTarifasSinTocarPersonalizadas(guardadas) {
  let cambios = 0;
  const resultado = guardadas.map((t) => {
    const anterior = TARIFAS_ANTERIORES.find((a) => a.tipoPrograma === t.tipoPrograma && a.categoria === t.categoria);
    const nueva = TARIFAS_DEFAULT.find((n) => n.tipoPrograma === t.tipoPrograma && n.categoria === t.categoria);
    if (anterior && nueva && t.valorOps === anterior.valorOps && t.valorBonificacion === anterior.valorBonificacion) {
      cambios++;
      return { ...t, valorOps: nueva.valorOps, valorBonificacion: nueva.valorBonificacion };
    }
    return t;
  });
  return { resultado, cambios };
}

function tarifaDe(tarifas, tipoPrograma, categoria) {
  return (
    tarifas.find((t) => t.tipoPrograma === tipoPrograma && t.categoria === categoria) ||
    tarifas.find((t) => t.categoria === categoria) ||
    tarifas[0]
  );
}

// Los programas de Educación Continua (EDCO) agrupan diplomados y cursos, así que
// en esos registros se escribe el nombre específico del programa a mano.
function esEdco(prog) {
  return !!prog && (prog.tipo === "EDCO" || String(prog.sigla || "").toUpperCase() === "EDCO");
}

// Tarifa que coincide exactamente en tipo de programa y categoría (sin respaldos).
function tarifaExacta(tarifas, tipoPrograma, categoria) {
  return tarifas.find((t) => t.tipoPrograma === tipoPrograma && t.categoria === categoria) || null;
}

// Lleva cualquier forma de escribir la categoría del docente (PhD, Doctor, Magíster, Especialista,
// Profesional-Virtual...) a los nombres que usa la tabla de tarifas. Devuelve "" si no la reconoce.
function normalizarCategoria(txt) {
  const t = String(txt ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  if (!t) return "";
  if (/DOCTOR|PH\.? ?D/.test(t)) return "Doctorado";
  if (/MAEST|MAGIS|MASTER|\bMSC\b/.test(t)) return "Maestría";
  if (/ESPECIAL/.test(t)) return "Especialización";
  if (/PROFESIONAL|VIRTUAL/.test(t)) return "Profesional / Virtual";
  return "";
}

// Valor hora que corresponde a un tipo de programa + categoría, sin inventar nada:
//  1) la tarifa exacta de esa combinación;
//  2) si la tabla tiene varias categorías para ese tipo de programa y todas pagan lo mismo, ese valor;
//  3) null (el valor se completa a mano).
function valorHoraPorCategoria(tarifas, tipoPrograma, categoria, tipoRegistro) {
  const campo = tipoRegistro === "OPS" ? "valorOps" : "valorBonificacion";
  const exacta = tarifaExacta(tarifas, tipoPrograma, categoria);
  if (exacta && exacta[campo] > 0) return exacta[campo];
  const delTipo = tarifas.filter((t) => t.tipoPrograma === tipoPrograma && t[campo] > 0);
  if (delTipo.length >= 2 && delTipo.every((t) => t[campo] === delTipo[0][campo])) return delTipo[0][campo];
  return null;
}

// Los registros creados antes de este cambio usaban nombres de escalafón distintos
// (Especialista/Magíster/Doctor). Se traducen al vocabulario actual sin tocar nada más.
const ESCALAFON_MIGRACION = { "Especialista": "Especialización", "Magíster": "Maestría", "Doctor": "Doctorado" };
function normalizarEscalafon(e) {
  return ESCALAFON_MIGRACION[e] || e;
}

// Identificador único real: no depende de un contador en memoria (que se
// reiniciaría cada vez que el artefacto se recarga), así nunca choca con IDs
// de registros creados en sesiones anteriores.
function generarId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function mkRecord(r, config = CONFIG_DEFAULT, tarifas = TARIFAS_DEFAULT, programas = PROGRAMAS_DEFAULT) {
  const prog = programas.find((p) => p.sigla === r.programa) || { tipo: "" };
  const tarifa = tarifaDe(tarifas, prog.tipo, r.escalafon);
  const valorHora = r.valorHora ?? valorHoraPorCategoria(tarifas, prog.tipo, r.escalafon, r.tipo) ?? (r.tipo === "OPS" ? tarifa.valorOps : tarifa.valorBonificacion);
  const documentos = r.tipo === "OPS" ? (r.documentos || Object.fromEntries(config.documentosRequeridos.map((d) => [d, "Pendiente"]))) : null;
  return { ...r, id: generarId(), _v: Date.now(), valorHora, documentos };
}

const RECORDS_INICIALES = [
  mkRecord({ noOPS: "OPS-2026-041", tipo: "OPS", programa: "MISW", cohorte: "12", ciclo: "3", modulo: "Arquitectura de Software Empresarial", docente: "Camilo Restrepo Ordóñez", correo: "camilo.restrepo@correo.com", horas: 32, escalafon: "Maestría", fechaInicio: "2026-07-31", fechaFin: "2026-08-28", estado: "Documentos Recibidos", documentos: { "Cédula": "Recibido", "RUT": "Recibido", "Cuenta de cobro": "Recibido", "Planilla pago PILA": "Pendiente", "OPS firmada": "Pendiente", "Certificado bancario": "Recibido", "Certificación SS": "Pendiente" }, actualizador: "Jorge" }),
  mkRecord({ tipo: "BONIFICACION", programa: "PhD", cohorte: "4", ciclo: "2", modulo: "Seminario de Investigación Doctoral II", docente: "Marcela Trujillo Vidal", correo: "marcela.trujillo@correo.com", horas: 16, escalafon: "Doctorado", fechaInicio: "2026-08-01", fechaFin: "2026-08-29", estado: "Curso finalizado", actualizador: "Jorge" }),
  mkRecord({ noOPS: "OPS-2026-042", tipo: "OPS", programa: "MTIAD", cohorte: "6", ciclo: "2", modulo: "Analítica Predictiva Avanzada", docente: "Andrés Felipe Zúñiga", correo: "afzuniga@correo.com", horas: 40, escalafon: "Maestría", fechaInicio: "2026-08-03", fechaFin: "2026-08-31", estado: "OPS Elaborada", actualizador: "Angie" }),
  mkRecord({ tipo: "BONIFICACION", programa: "MGP", cohorte: "9", ciclo: "1", modulo: "Dirección Estratégica de Portafolios", docente: "Laura Ximena Bermúdez", correo: "laura.bermudez@correo.com", horas: 24, escalafon: "Maestría", fechaInicio: "2026-08-10", fechaFin: "2026-09-04", estado: "Bonificación registrada", actualizador: "Diana" }),
  mkRecord({ noOPS: "OPS-2026-038", tipo: "OPS", programa: "EGIP", cohorte: "18.3", ciclo: "1", modulo: "Gestión del Riesgo en Proyectos", docente: "Diego Hernán Salazar", correo: "dsalazar@correo.com", horas: 32, escalafon: "Especialización", fechaInicio: "2026-07-27", fechaFin: "2026-08-25", estado: "Documentos Solicitados", documentos: { "Cédula": "Recibido", "RUT": "Pendiente", "Cuenta de cobro": "Pendiente", "Planilla pago PILA": "Pendiente", "OPS firmada": "Pendiente", "Certificado bancario": "Pendiente", "Certificación SS": "Pendiente" }, actualizador: "Jorge" }),
  mkRecord({ noOPS: "OPS-2026-020", tipo: "OPS", programa: "EPDS", cohorte: "10", ciclo: "2", modulo: "Aseguramiento de Calidad de Software", docente: "Natalia Ríos Peña", correo: "natalia.rios@correo.com", horas: 32, escalafon: "Maestría", fechaInicio: "2026-06-15", fechaFin: "2026-07-13", estado: "Pagado", documentos: { "Cédula": "Recibido", "RUT": "Recibido", "Cuenta de cobro": "Recibido", "Planilla pago PILA": "Recibido", "OPS firmada": "Recibido", "Certificado bancario": "Recibido", "Certificación SS": "Recibido" }, actualizador: "Carolina" }),
  mkRecord({ tipo: "BONIFICACION", programa: "MBIO", cohorte: "3", ciclo: "3", modulo: "Bioprocesos Industriales", docente: "Esteban Cárdenas Molano", correo: "ecardenas@correo.com", horas: 20, escalafon: "Doctorado", fechaInicio: "2026-06-01", fechaFin: "2026-06-29", estado: "Pagado", actualizador: "Paola" }),
  mkRecord({ noOPS: "OPS-2026-035", tipo: "OPS", programa: "EGPPS", cohorte: "5", ciclo: "1", modulo: "Gestión de la Calidad Total", docente: "Paola Andrea Muñoz", correo: "pmunoz@correo.com", horas: 32, escalafon: "Especialización", fechaInicio: "2026-07-10", fechaFin: "2026-08-07", estado: "Pendiente de pago", documentos: { "Cédula": "Recibido", "RUT": "Recibido", "Cuenta de cobro": "Recibido", "Planilla pago PILA": "Recibido", "OPS firmada": "Recibido", "Certificado bancario": "Recibido", "Certificación SS": "Recibido" }, actualizador: "Jorge" }),
  mkRecord({ noOPS: "OPS-2026-045", tipo: "OPS", programa: "MISW", cohorte: "12", ciclo: "3", modulo: "Fundamentos de DevOps", docente: "Julián Esteban Rojas", correo: "jrojas@correo.com", horas: 32, escalafon: "Maestría", fechaInicio: "2026-09-01", fechaFin: "2026-09-29", estado: "OPS Solicitada", actualizador: "Angie" }),
  mkRecord({ tipo: "BONIFICACION", programa: "PhD", cohorte: "4", ciclo: "2", modulo: "Metodología de la Investigación", docente: "Sandra Milena Ocampo", correo: "socampo@correo.com", horas: 16, escalafon: "Doctorado", fechaInicio: "2026-08-15", fechaFin: "2026-08-22", estado: "Visto Bueno solicitado", actualizador: "Diana" }),
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                             */
/* ------------------------------------------------------------------ */
const COP = (n) => n == null ? "—" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const fmtDate = (s) => s ? new Date(s + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const daysDiff = (s) => Math.round((new Date(s + "T00:00:00") - HOY) / 86400000);
const valorTotal = (rec) => rec.horas * rec.valorHora;
/* ---- Seguridad social de OPS (IBC mensual completo) ----
   Separa dos conceptos: (1) el valor pagado por las horas trabajadas (valorTotal) y
   (2) la base de cotización (IBC) = max(40 % de los ingresos del mes, 1 SMMLV), con tope de 25 SMMLV.
   La norma se toma de config.normaSS[año]; si no existe el año, se usa el más reciente anterior. */
// El módulo se paga completo en el mes en que FINALIZA: ese es el único mes de cotización.
const mesesDelPeriodo = (fechaInicio, fechaFin) => {
  const ref = String(fechaFin || fechaInicio || "").slice(0, 7).split("-").map(Number);
  if (ref.length < 2 || !ref[0] || !ref[1]) return [];
  return [{ anio: ref[0], mes: ref[1] }];
};
const normaSSDelAnio = (config, anio) => {
  const n = config.normaSS || {};
  const anios = Object.keys(n).map(Number).filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
  if (!anios.length) return null;
  const usado = anios.filter((v) => v <= anio).pop() ?? anios[0];
  return { ...n[usado], anioNorma: usado, exacta: usado === anio };
};
const aproxPILA = (v, activo) => activo ? Math.ceil(Math.round(v) / 100) * 100 : Math.round(v);
function liquidarSS(ingresosMes, anio, config) {
  const n = normaSSDelAnio(config, anio);
  if (!n) return null;
  const ibcInicial = ingresosMes * (n.ibcPct / 100);
  const minimo = n.smmlv;
  const maximo = n.smmlv * (n.topeSmmlv || 25);
  const ibc = Math.min(Math.max(ibcInicial, minimo), maximo);
  const ajuste = ibc > ibcInicial ? "minimo" : ibc < ibcInicial ? "maximo" : "ninguno";
  const arlPct = (n.arl || {})[config.arlClase] ?? 0;
  const r = (pct) => aproxPILA(ibc * (pct / 100), config.redondeoPILA);
  const salud = r(n.saludPct), pension = r(n.pensionPct), arl = r(arlPct), otros = r(config.otrosPct || 0);
  return { anio, ibcInicial, ibc, minimo, maximo, ajuste, salud, pension, arl, otros, arlPct, total: salud + pension + arl + otros, norma: n };
}
function liquidacionSS(rec, config) {
  if (rec.tipo !== "OPS") return null;
  const valorHoras = valorTotal(rec);
  const periodo = mesesDelPeriodo(rec.fechaInicio, rec.fechaFin);
  if (!periodo.length) return null;
  const ingresosMes = valorHoras / periodo.length; // todo el valor se paga en el mes de finalización
  const meses = periodo.map((p) => ({ ...p, ...liquidarSS(ingresosMes, p.anio, config) }));
  if (meses.some((m) => m.ibc == null)) return null;
  const suma = (k) => meses.reduce((a, m) => a + m[k], 0);
  return {
    valorHoras, ingresosMes, meses, nMeses: meses.length,
    ibcInicial: suma("ibcInicial"), ibc: suma("ibc"),
    salud: suma("salud"), pension: suma("pension"), arl: suma("arl"), otros: suma("otros"), total: suma("total"),
    ajustadoAlMinimo: meses.some((m) => m.ajuste === "minimo"),
    ajustadoAlMaximo: meses.some((m) => m.ajuste === "maximo"),
    normaNoExacta: meses.some((m) => !m.norma.exacta),
    anioNorma: meses[0].norma.anioNorma,
  };
}
const calcIbc = (rec, config) => { const l = liquidacionSS(rec, config); return l ? l.ibc : null; };
const calcSS = (rec, config) => { const l = liquidacionSS(rec, config); return l ? l.total : null; };

function PanelSS({ liq, config }) {
  if (!liq) return <div style={{ fontSize: 12, color: "var(--brick)" }}>No hay norma de seguridad social configurada. Defínala en Administración.</div>;
  const f = liq.meses[0];
  const fila = (a, b, opts = {}) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: opts.soft ? "var(--ink-soft)" : "inherit", fontWeight: opts.bold ? 700 : 400 }}>
      <span>{a}</span><span className="font-mono">{b}</span>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12.5 }}>
      {fila("Valor pagado por horas", COP(liq.valorHoras), { soft: true })}
      <div style={{ height: 1, background: "var(--line)", margin: "2px 0" }} />
      {fila(`IBC inicial (${f.norma.ibcPct}%${liq.nMeses > 1 ? ` × ${liq.nMeses} meses` : ""})`, COP(liq.ibcInicial))}
      {fila(`SMMLV ${f.anio}${f.norma.exacta ? "" : ` (norma ${f.norma.anioNorma})`}`, COP(f.minimo), { soft: true })}
      {fila(`IBC definitivo${liq.nMeses > 1 ? ` (${liq.nMeses} meses)` : ""}`, COP(liq.ibc), { bold: true })}
      {liq.ajustadoAlMinimo && <div style={{ fontSize: 11.5, color: "var(--gold, #8a6d1d)" }}>El 40 % queda por debajo del mínimo legal: se cotiza sobre 1 SMMLV por mes completo, sin importar las horas trabajadas.</div>}
      {liq.ajustadoAlMaximo && <div style={{ fontSize: 11.5, color: "var(--gold, #8a6d1d)" }}>El IBC se limitó al tope de {f.norma.topeSmmlv} SMMLV.</div>}
      {liq.normaNoExacta && <div style={{ fontSize: 11.5, color: "var(--brick)" }}>No hay norma configurada para el año del periodo; se usó la del año {liq.anioNorma}. Agregue el año en Administración.</div>}
      <div style={{ height: 1, background: "var(--line)", margin: "2px 0" }} />
      {fila(`Salud (${f.norma.saludPct}%)`, COP(liq.salud))}
      {fila(`Pensión (${f.norma.pensionPct}%)`, COP(liq.pension))}
      {fila(`ARL clase ${config.arlClase} (${f.arlPct}%)`, COP(liq.arl))}
      {config.otrosPct ? fila(`Otros (${config.otrosPct}%)`, COP(liq.otros)) : null}
      {fila("Total seguridad social", COP(liq.total), { bold: true })}
    </div>
  );
}
/* ------------------------------------------------------------------ */
/*  AUDITOR INTELIGENTE DE PAGOS Y BONIFICACIONES                       */
/*  Capa 1 (determinista): reglas que calculan y comparan datos.        */
/*  Capa 2 (IA): explica y prioriza los hallazgos. SOLO SUGIERE: no     */
/*  modifica registros, no aprueba ni bloquea pagos.                    */
/* ------------------------------------------------------------------ */
const AUD_SEV = {
  alta: { label: "Alta", tone: "brick", orden: 0 },
  media: { label: "Media", tone: "amber", orden: 1 },
  baja: { label: "Baja", tone: "gold", orden: 2 },
};
const ESTADOS_PAGO_O_ENVIO = ["Enviado a OPS", "Pendiente de pago", "Pagado", "Enviado para pago"];
const ESTADOS_VB_O_MAS_OPS = ["Visto Bueno Director/Coordinador", "Visto Bueno Decanatura", "Enviado a OPS", "Pendiente de pago", "Pagado"];

function auditarRegistros(records, tarifas, programas, config) {
  const out = [];
  const nt = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const tipoTxt = (r) => (r.tipo === "OPS" ? "OPS" : "bonificación");
  const etiqueta = (r) => `${r.docente} · ${r.modulo}`;
  const add = (r, regla, sev, titulo, detalle, sugerencia) => {
    const firma = [r.tipo, r.horas, r.valorHora, r.fechaInicio, r.fechaFin, r.estado].join("~");
    out.push({ key: `${regla}|${r.id}|${firma}`, regla, sev, recId: r.id, etiqueta: etiqueta(r), tipoRegistro: r.tipo, titulo, detalle, sugerencia });
  };
  const grupos = (fnKey) => {
    const m = new Map();
    for (const r of records) { const k = fnKey(r); if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
    return m;
  };
  const claveCurso = (r) => [nt(r.programa), nt(r.cohorte), nt(r.modulo)].join("|");

  // R1. Registro duplicado (mismo tipo, docente y curso)
  for (const g of grupos((r) => [r.tipo, nt(r.docente), claveCurso(r)].join("|")).values()) {
    if (g.length < 2) continue;
    for (const r of g) add(r, "duplicado", "alta", `Posible ${tipoTxt(r)} duplicada`,
      `Hay ${g.length} registros de ${tipoTxt(r)} para ${r.docente} en «${r.modulo}» (${r.programa}${r.cohorte ? `, cohorte ${r.cohorte}` : ""}). Este tiene estado «${r.estado}», ${r.horas} h y total ${COP(valorTotal(r))}. Pagar ambos duplicaría el valor.`,
      "Compare los registros y elimine o corrija el repetido antes de aprobar el pago.");
  }
  // R2. OPS y bonificación del mismo docente por el mismo curso
  for (const g of grupos((r) => [nt(r.docente), claveCurso(r)].join("|")).values()) {
    if (!(g.some((r) => r.tipo === "OPS") && g.some((r) => r.tipo !== "OPS"))) continue;
    for (const r of g) add(r, "ops_y_bonificacion", "alta", "OPS y bonificación por el mismo curso",
      `${r.docente} tiene una OPS y una bonificación registradas para «${r.modulo}». Normalmente un curso se paga por una sola vía.`,
      "Confirme cuál es la vía de pago correcta y elimine la otra.");
  }
  // R3. Número de OPS repetido
  for (const g of grupos((r) => (r.tipo === "OPS" && r.noOPS ? nt(r.noOPS) : "")).values()) {
    if (g.length < 2) continue;
    for (const r of g) add(r, "noops_repetido", "alta", "Número de OPS repetido",
      `El número ${r.noOPS} aparece en ${g.length} registros (${g.map((x) => x.docente).join(", ")}).`,
      "Cada OPS debe tener un número único. Corrija el número en el registro equivocado.");
  }
  // R9. Varias OPS del mismo docente que finalizan el mismo mes (efecto en seguridad social)
  for (const g of grupos((r) => (r.tipo === "OPS" && r.fechaFin ? `${nt(r.docente)}|${String(r.fechaFin).slice(0, 7)}` : "")).values()) {
    if (g.length < 2) continue;
    for (const r of g) add(r, "ss_varias_ops_mes", "media", "Varias OPS del docente en el mismo mes",
      `${r.docente} tiene ${g.length} OPS que finalizan en ${String(r.fechaFin).slice(0, 7)}. La aplicación liquida cada una por separado (mínimo de 1 SMMLV en cada una), pero el aporte real del mes puede calcularse sobre la suma de los ingresos.`,
      "Verifique con Contabilidad/Nómina si los aportes deben consolidarse en una sola base mensual.");
  }

  for (const r of records) {
    const prog = programas.find((p) => p.sigla === r.programa);
    const esOps = r.tipo === "OPS";
    const total = valorTotal(r);

    // R4. Datos esenciales
    if (!(Number(r.horas) > 0) || !(Number(r.valorHora) > 0)) {
      add(r, "valor_incompleto", "alta", "Falta el valor hora o las horas",
        `El registro tiene ${r.horas || 0} horas y valor hora ${COP(r.valorHora)}; el total a pagar (${COP(total)}) no es confiable.`,
        "Complete las horas y el valor hora (o asigne la categoría correcta del docente) antes de continuar.");
    } else {
      // R5. Tarifa distinta a la configurada
      // Los cursos que terminaron antes de la vigencia se pagaron con tarifas anteriores (no guardadas): no se contrastan.
      const vigente = !config.tarifasVigentesDesde || !r.fechaFin || r.fechaFin >= config.tarifasVigentesDesde;
      if (prog && vigente) {
        const esperado = valorHoraPorCategoria(tarifas, prog.tipo, r.escalafon, r.tipo);
        if (esperado == null) {
          add(r, "tarifa_sin_configurar", "media", "No hay tarifa configurada para este docente",
            `No existe una tarifa para ${prog.tipo} / ${r.escalafon || "sin categoría"}. El valor hora (${COP(r.valorHora)}) no se puede contrastar.`,
            "Defina la tarifa en Administración o corrija la categoría del docente.");
        } else if (Math.round(esperado) !== Math.round(r.valorHora)) {
          const dif = (r.valorHora - esperado) * r.horas;
          add(r, "tarifa_distinta", "alta", "Valor hora distinto a la tarifa configurada",
            `El registro usa ${COP(r.valorHora)} por hora, pero la tarifa configurada para ${prog.tipo} / ${r.escalafon} (${tipoTxt(r)}) es ${COP(esperado)}. Con ${r.horas} h el total difiere en ${COP(Math.abs(dif))} (${dif > 0 ? "de más" : "de menos"}).`,
            "Verifique el cálculo antes de aprobar: ajuste el valor hora a la tarifa o confirme que es una excepción autorizada.");
        }
      }
    }
    // R6. Horas distintas a las del mismo curso (otros docentes del mismo curso)
    if (Number(r.horas) > 0) {
      const pares = records.filter((x) => x.id !== r.id && x.tipo === r.tipo && claveCurso(x) === claveCurso(r) && Number(x.horas) > 0);
      if (pares.length >= 2) {
        const cuenta = new Map();
        pares.forEach((x) => cuenta.set(Number(x.horas), (cuenta.get(Number(x.horas)) || 0) + 1));
        const [horasComunes, n] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0];
        if (n === pares.length && horasComunes !== Number(r.horas)) {
          add(r, "horas_distintas", "media", "Horas distintas a las del resto del curso",
            `Este registro paga ${r.horas} h, mientras que los otros ${pares.length} registros de «${r.modulo}» pagan ${horasComunes} h.`,
            "Compare con las horas programadas del curso y corrija si hay un error de digitación.");
        }
      }
    }
    // R7. Fechas
    if (!r.fechaInicio || !r.fechaFin) {
      add(r, "fechas_faltantes", "media", "Faltan fechas del curso", "El registro no tiene fecha de inicio o de finalización, por lo que no se puede ubicar el mes de pago.", "Complete las fechas del curso.");
    } else if (r.fechaFin < r.fechaInicio) {
      add(r, "fechas_invertidas", "alta", "La fecha de fin es anterior al inicio", `El curso termina (${fmtDate(r.fechaFin)}) antes de empezar (${fmtDate(r.fechaInicio)}).`, "Corrija las fechas: el mes de pago y la seguridad social dependen de la fecha de fin.");
    }
    // R8. Estado vs avance real
    if (r.fechaFin && ESTADOS_PAGO_O_ENVIO.includes(r.estado) && daysDiff(r.fechaFin) > 0) {
      add(r, "pago_antes_de_fin", "alta", "Envío o pago antes de que termine el curso",
        `El estado es «${r.estado}», pero el curso termina el ${fmtDate(r.fechaFin)}. El módulo se paga en el mes en que finaliza.`,
        "Confirme que el curso ya terminó o devuelva el registro a un estado anterior.");
    }
    if (esOps && r.documentos) {
      const pend = Object.entries(r.documentos).filter(([, v]) => v === "Pendiente").map(([k]) => k);
      if (pend.length && ESTADOS_VB_O_MAS_OPS.includes(r.estado)) {
        add(r, "avance_sin_documentos", r.estado === "Pagado" || r.estado === "Pendiente de pago" || r.estado === "Enviado a OPS" ? "alta" : "media", "Avanzó con documentos pendientes",
          `La OPS está en «${r.estado}» pero siguen pendientes: ${pend.join(", ")}.`,
          "Reciba los documentos pendientes (o márquelos «No aplica» si corresponde) antes de enviar a pago.");
      }
      if (!r.noOPS && ["Enviado a OPS", "Pendiente de pago", "Pagado"].includes(r.estado)) {
        add(r, "sin_numero_ops", "alta", "OPS sin número", `La OPS está en «${r.estado}» y no tiene número asignado.`, "Asigne el número de OPS en el registro.");
      }
    }
    // R10. Seguridad social
    if (esOps && Number(r.horas) > 0 && Number(r.valorHora) > 0) {
      const liq = liquidacionSS(r, config);
      if (!liq) {
        add(r, "ss_no_calculable", "media", "No se pudo calcular la seguridad social", "Falta la norma de seguridad social o las fechas del periodo.", "Revise Administración → Cálculos de seguridad social.");
      } else if (liq.normaNoExacta) {
        add(r, "ss_norma_no_exacta", "baja", "Norma de seguridad social provisional",
          `El SMMLV y las tarifas del año en que termina el curso no están configurados; la liquidación usa provisionalmente los de ${liq.anioNorma}.`, "Cuando se publique el SMMLV de ese año, agréguelo en Administración → Norma por año.");
      }
    }
    // R11. Datos de contacto y catálogo
    if (!String(r.docente || "").trim() || /^sin asignar$/i.test(String(r.docente).trim())) {
      add(r, "docente_sin_asignar", "media", "Docente sin asignar", `«${r.modulo}» no tiene docente asignado; no se puede tramitar la OPS ni la bonificación.`, "Asigne el docente cuando esté definido.");
    }
    if (!prog) {
      add(r, "programa_desconocido", "media", "Programa fuera del catálogo", `El programa «${r.programa || "—"}» no existe en el catálogo, así que no se puede validar la tarifa.`, "Corrija el programa o agréguelo al catálogo.");
    }
    if (esOps && !String(r.correo || "").trim() && ESTADOS_VB_O_MAS_OPS.includes(r.estado)) {
      add(r, "sin_correo", "baja", "Docente sin correo", `${r.docente} no tiene correo registrado y la OPS ya está avanzada.`, "Registre el correo para poder pedir documentos o formatos.");
    }
  }
  return out.sort((a, b) => AUD_SEV[a.sev].orden - AUD_SEV[b.sev].orden);
}

async function llamarIAParaAuditor(prompt, maxTokens = 2500) {
  const cuerpo = JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages: [{ role: "user", content: [{ type: "text", text: prompt }] }] });
  let ultimoError = "";
  for (let intento = 0; intento < 3; intento++) {
    if (intento > 0) await new Promise((r) => setTimeout(r, 2500 * intento));
    let response;
    try {
      response = await fetch("api/ia", { method: "POST", headers: { "Content-Type": "application/json", ...(window.__gopsAuth ? window.__gopsAuth() : {}) }, body: cuerpo });
    } catch (e) { ultimoError = "No se pudo conectar con la IA. Revisa tu conexión e inténtalo de nuevo."; continue; }
    let json = null;
    try { json = await response.json(); } catch (e) { json = null; }
    if (response.ok && json && !json.error) return (json.content || []).map((i) => (i.type === "text" ? i.text : "")).join("\n");
    const detalle = (json && json.error && json.error.message) || `HTTP ${response.status}`;
    if (response.status === 429 || response.status === 529 || response.status >= 500) { ultimoError = `La IA está ocupada o limitó las solicitudes (${detalle}). Espera un minuto y vuelve a intentar.`; continue; }
    throw new Error(detalle);
  }
  throw new Error(ultimoError || "La IA no respondió");
}

// La IA recibe SOLO los hallazgos ya calculados (sin correos, teléfonos ni documentos) y devuelve explicaciones.
async function explicarHallazgosConIA(hallazgos) {
  const lote = hallazgos.slice(0, 25);
  const datos = lote.map((h, i) => ({ i, regla: h.regla, severidad: h.sev, tipo: h.tipoRegistro === "OPS" ? "OPS" : "Bonificación", registro: h.etiqueta, hallazgo: h.titulo, detalle: h.detalle }));
  const prompt = `Eres el "Auditor inteligente de pagos y bonificaciones" de GOPS, una aplicación que usa la auxiliar administrativa de posgrados de una universidad colombiana para tramitar OPS y bonificaciones de docentes.

Un motor de reglas YA detectó los hallazgos de abajo con cálculos exactos. Tu trabajo es SOLO explicarlos y priorizarlos para que una persona decida. Reglas estrictas:
- No recalcules ni cambies ninguna cifra: usa exactamente las que aparecen en "detalle".
- No inventes hallazgos nuevos ni datos que no estén aquí.
- No apruebes ni rechaces pagos: solo sugiere qué revisar. Usa un tono claro y cordial, en español.
- Cada explicación: máximo 2 frases. Cada acción: máximo 1 frase, empezando con un verbo (por ejemplo "Verifique el cálculo antes de aprobar").

Hallazgos (JSON):
${JSON.stringify(datos)}

Responde SOLO con un objeto JSON válido, sin texto antes ni después y sin bloques de código, con esta forma exacta:
{"resumen":"<2 a 3 frases con lo más importante y por dónde empezar>","items":[{"i":0,"explicacion":"","accion":"","orden":1}]}
"orden" es la posición de prioridad (1 = revisar primero) y no se repite entre items.`;
  const texto = await llamarIAParaAuditor(prompt);
  const res = parsearJSONIA(texto);
  if (!res || !Array.isArray(res.items)) throw new Error("La IA no devolvió un resultado estructurado. Vuelve a intentar.");
  const porKey = {};
  for (const it of res.items) {
    const h = lote[Number(it.i)];
    if (h) porKey[h.key] = { explicacion: String(it.explicacion || ""), accion: String(it.accion || ""), orden: Number(it.orden) || 99 };
  }
  return { resumen: String(res.resumen || ""), porKey, analizados: lote.length, total: hallazgos.length };
}

function AuditorView({ hallazgos, revisados, setRevisados, onOpen, notify }) {
  const [fSev, setFSev] = useState("todas");
  const [ia, setIa] = useState({ estado: "idle", resumen: "", porKey: {}, error: "", analizados: 0, total: 0 });
  const pendientes = hallazgos.filter((h) => !revisados.includes(h.key));
  const cuenta = (s) => pendientes.filter((h) => h.sev === s).length;
  const visibles = pendientes.filter((h) => fSev === "todas" || h.sev === fSev);
  const ordenados = ia.estado === "ok"
    ? [...visibles].sort((a, b) => (ia.porKey[a.key]?.orden ?? 999) - (ia.porKey[b.key]?.orden ?? 999) || AUD_SEV[a.sev].orden - AUD_SEV[b.sev].orden)
    : visibles;

  async function analizar() {
    if (!pendientes.length) return;
    setIa((s) => ({ ...s, estado: "cargando", error: "" }));
    try {
      const r = await explicarHallazgosConIA(pendientes);
      setIa({ estado: "ok", resumen: r.resumen, porKey: r.porKey, error: "", analizados: r.analizados, total: r.total });
    } catch (e) {
      setIa((s) => ({ ...s, estado: "error", error: e.message || "No se pudo analizar con la IA" }));
    }
  }
  const marcar = (key) => { setRevisados((rs) => [...rs, key]); notify("Hallazgo marcado como revisado"); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Banner arte="ajustes" desde="#0F766E" hasta="#5B45D6" titulo="Auditor de pagos y bonificaciones" subtitulo="Revisa los datos registrados antes de procesar un pago. Solo sugiere: la decisión es suya." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KPI icon={AlertTriangle} label="Prioridad alta" value={cuenta("alta")} tone="coral" />
        <KPI icon={Clock} label="Prioridad media" value={cuenta("media")} tone="amber" />
        <KPI icon={FileWarning} label="Prioridad baja" value={cuenta("baja")} tone="violet" />
        <KPI icon={CheckCircle2} label="Marcados como revisados" value={hallazgos.length - pendientes.length} tone="green" />
      </div>

      <section style={cardStyle}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ ...sectionTitle, marginBottom: 2, display: "flex", alignItems: "center", gap: 7 }}><Sparkles size={15} /> Análisis con IA</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Las reglas detectan y calculan; la IA explica con palabras sencillas y ordena qué revisar primero. Solo recibe los hallazgos, no documentos ni correos.</div>
          </div>
          <button onClick={analizar} disabled={ia.estado === "cargando" || !pendientes.length}
            style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: 11, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: ia.estado === "cargando" || !pendientes.length ? "not-allowed" : "pointer", opacity: ia.estado === "cargando" || !pendientes.length ? 0.6 : 1 }}>
            {ia.estado === "cargando" ? "Analizando…" : ia.estado === "ok" ? "Volver a analizar" : "Explicar y priorizar con IA"}
          </button>
        </div>
        {ia.estado === "error" && <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--brick)" }}>{ia.error} Las reglas siguen funcionando sin la IA.</div>}
        {ia.estado === "ok" && (
          <div style={{ marginTop: 12, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, fontSize: 13 }}>
            {ia.resumen}
            {ia.total > ia.analizados && <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-soft)" }}>Se analizaron los {ia.analizados} primeros de {ia.total} hallazgos (los de mayor prioridad).</div>}
            <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-soft)" }}>Sugerencia de la IA: revísela antes de actuar.</div>
          </div>
        )}
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {["todas", "alta", "media", "baja"].map((s) => (
          <button key={s} onClick={() => setFSev(s)} style={{ border: "1px solid var(--line-strong)", background: fSev === s ? "var(--ink)" : "var(--paper-raised)", color: fSev === s ? "#fff" : "var(--ink)", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {s === "todas" ? "Todas" : AUD_SEV[s].label}
          </button>
        ))}
        {hallazgos.length - pendientes.length > 0 && (
          <button onClick={() => { setRevisados([]); notify("Se restablecieron los hallazgos revisados"); }} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, border: "none", background: "none", color: "var(--ink-soft)", textDecoration: "underline", cursor: "pointer" }}>
            Restablecer {hallazgos.length - pendientes.length} revisado{hallazgos.length - pendientes.length === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {ordenados.length === 0 ? (
        <section style={{ ...cardStyle, textAlign: "center", color: "var(--ink-soft)", fontSize: 13.5 }}>
          <CheckCircle2 size={28} style={{ color: "var(--moss)" }} />
          <div style={{ marginTop: 8, fontWeight: 600, color: "var(--ink)" }}>{hallazgos.length === 0 ? "No se encontraron inconsistencias" : "No hay hallazgos pendientes en este filtro"}</div>
          <div style={{ marginTop: 4 }}>Se revisan duplicados, tarifas, horas, fechas, estados y seguridad social de todos los registros.</div>
        </section>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ordenados.map((h) => {
                        const x = ia.porKey[h.key];
            return (
              <section key={h.key} style={{ ...cardStyle, padding: 16, }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <Pill tone={AUD_SEV[h.sev].tone}>{AUD_SEV[h.sev].label}</Pill>
                  <Pill tone="neutral">{h.tipoRegistro === "OPS" ? "OPS" : "Bonificación"}</Pill>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{h.titulo}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>{h.etiqueta}</div>
                <div style={{ marginTop: 8, fontSize: 13 }}>{h.detalle}</div>
                <div style={{ marginTop: 6, fontSize: 12.5 }}><b>Sugerencia:</b> {h.sugerencia}</div>
                {x && (x.explicacion || x.accion) && (
                  <div style={{ marginTop: 8, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 10, fontSize: 12.5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 3 }}><Sparkles size={13} /> IA · prioridad {x.orden}</div>
                    {x.explicacion} {x.accion && <b>{x.accion}</b>}
                  </div>
                )}
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button onClick={() => onOpen(h.recId)} style={{ fontSize: 12, fontWeight: 600, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", borderRadius: 7, padding: "6px 11px", cursor: "pointer" }}>Abrir registro</button>
                  <button onClick={() => marcar(h.key)} style={{ fontSize: 12, fontWeight: 600, border: "none", background: "var(--moss)", color: "#fff", borderRadius: 7, padding: "6px 11px", cursor: "pointer" }}>Marcar como revisado</button>
                </div>
              </section>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Un hallazgo marcado como revisado vuelve a aparecer si cambian las horas, el valor hora, las fechas o el estado del registro.</p>
    </div>
  );
}

function AvisoAuditoria({ hallazgos, onIr }) {
  if (!hallazgos.length) return null;
  const alta = hallazgos.some((h) => h.sev === "alta");
  return (
    <div style={{ marginTop: 14, background: alta ? "var(--brick-soft)" : "var(--amber-soft)", border: `1px solid ${alta ? "var(--brick)" : "var(--amber)"}`, borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700 }}><AlertTriangle size={14} /> Auditor: {hallazgos.length} {hallazgos.length === 1 ? "punto por revisar" : "puntos por revisar"} antes de procesar el pago</div>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12.5 }}>
        {hallazgos.slice(0, 4).map((h) => <li key={h.key} style={{ marginBottom: 3 }}><b>{h.titulo}.</b> {h.detalle}</li>)}
      </ul>
      {hallazgos.length > 4 && <div style={{ fontSize: 12, marginTop: 4 }}>y {hallazgos.length - 4} más…</div>}
      <button onClick={onIr} style={{ marginTop: 8, fontSize: 12, fontWeight: 600, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>Ver en el Auditor</button>
    </div>
  );
}

function fillTemplate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}

function urgencia(rec) {
  if (rec.estado === "Pagado") return { level: "done", label: "Pagado", dot: "var(--moss)" };
  const d = daysDiff(rec.fechaFin);
  if (d < 0) return { level: "red", label: `Finalizó hace ${Math.abs(d)} día${Math.abs(d) === 1 ? "" : "s"}`, dot: "var(--brick)" };
  if (d === 0) return { level: "red", label: "Finaliza hoy", dot: "var(--brick)" };
  if (d === 1) return { level: "orange", label: "Finaliza mañana", dot: "var(--amber)" };
  if (d <= 3) return { level: "amber", label: `Finaliza en ${d} días`, dot: "var(--amber)" };
  if (d <= 7) return { level: "yellow", label: `Finaliza en ${d} días`, dot: "var(--gold)" };
  return { level: "green", label: `Finaliza en ${d} días`, dot: "var(--moss)" };
}

function docsPct(rec) {
  if (!rec.documentos) return null;
  const vals = Object.values(rec.documentos);
  if (vals.length === 0) return 100;
  const done = vals.filter((v) => v === "Recibido" || v === "No aplica").length;
  return Math.round((done / vals.length) * 100);
}
function siguienteEstadoDoc(actual) {
  if (actual === "Pendiente") return "Recibido";
  if (actual === "Recibido") return "No aplica";
  return "Pendiente";
}

function tareaSugerida(rec) {
  const u = urgencia(rec);
  if (rec.estado === "Pagado") return null;
  if (u.level === "red" && daysDiff(rec.fechaFin) < 0) return { texto: "Curso finalizado sin gestionar el proceso de pago", prioridad: 0 };
  if (rec.tipo === "OPS" && docsPct(rec) !== null && docsPct(rec) < 100 && daysDiff(rec.fechaFin) <= 3) return { texto: "Documentos pendientes por recibir", prioridad: 1 };
  if (rec.estado.startsWith("Visto Bueno") && !rec.estado.includes("recibido")) return { texto: "Visto bueno pendiente por solicitar o confirmar", prioridad: 1 };
  if (rec.estado === "Pendiente de pago" || rec.estado === "Enviado a OPS" || rec.estado === "Enviado para pago") return { texto: "OPS/Bonificación lista, falta registrar el pago", prioridad: 2 };
  if (u.level === "red" || u.level === "orange") return { texto: "El curso termina hoy o mañana — preparar el proceso de pago", prioridad: 0 };
  if (u.level === "amber" || u.level === "yellow") return { texto: "El curso termina pronto — revisar estado", prioridad: 2 };
  return null;
}

function emailTemplate(rec, config, programas = PROGRAMAS_DEFAULT) {
  const prog = programas.find((p) => p.sigla === rec.programa) || { sigla: rec.programa, nombre: rec.programa, tipo: "", pa: "—", cc: "—", coordinador: "—", correo: "—" };
  const vars = {
    coordinador: prog.coordinador.split(" ")[0],
    docente: rec.docente,
    programa: rec.nombrePrograma || prog.nombre,
    modulo: rec.modulo,
    cohorte: rec.cohorte || "",
    horas: rec.horas,
    valor: COP(valorTotal(rec)),
    fechaInicio: fmtDate(rec.fechaInicio),
    fechaFin: fmtDate(rec.fechaFin),
    noOps: rec.noOPS || "N/A",
    usuario: config.usuarioActual,
  };
  return { asunto: fillTemplate(config.plantillaAsunto, vars), cuerpo: fillTemplate(config.plantillaCuerpo, vars), para: prog.correo, tipo: "coordinador" };
}

function emailDecanaTemplate(rec, config, programas = PROGRAMAS_DEFAULT) {
  const prog = programas.find((p) => p.sigla === rec.programa) || { sigla: rec.programa, nombre: rec.programa, tipo: "", pa: "—", cc: "—", coordinador: "—", correo: "—" };
  const vars = {
    decana: config.decanaNombre,
    docente: rec.docente,
    programa: rec.nombrePrograma || prog.nombre,
    modulo: rec.modulo,
    cohorte: rec.cohorte || "",
    horas: rec.horas,
    valor: COP(valorTotal(rec)),
    fechaInicio: fmtDate(rec.fechaInicio),
    fechaFin: fmtDate(rec.fechaFin),
    tipoVinculacion: rec.tipo === "OPS" ? "OPS" : "Bonificación",
    noOps: rec.noOPS || "N/A",
    usuario: config.usuarioActual,
  };
  return { asunto: fillTemplate(config.plantillaDecanaAsunto, vars), cuerpo: fillTemplate(config.plantillaDecanaCuerpo, vars), para: config.decanaCorreo, tipo: "decana" };
}

function emailFormatoBonificacionTemplate(rec, config, programas = PROGRAMAS_DEFAULT) {
  const prog = programas.find((p) => p.sigla === rec.programa) || { sigla: rec.programa, nombre: rec.programa, tipo: "", pa: "—", cc: "—", coordinador: "—", correo: "—" };
  const vars = {
    docente: rec.docente,
    programa: rec.nombrePrograma || prog.nombre,
    modulo: rec.modulo,
    cohorte: rec.cohorte || "",
    horas: rec.horas,
    valor: COP(valorTotal(rec)),
    fechaInicio: fmtDate(rec.fechaInicio),
    fechaFin: fmtDate(rec.fechaFin),
    usuario: config.usuarioActual,
  };
  return { asunto: fillTemplate(config.plantillaBonifAsunto, vars), cuerpo: fillTemplate(config.plantillaBonifCuerpo, vars), para: rec.correo, tipo: "bonificacion" };
}

function emailPendientesTemplate(rec, config, programas, pendientes, observaciones) {
  const prog = programas.find((p) => p.sigla === rec.programa) || { sigla: rec.programa, nombre: rec.programa, tipo: "", pa: "—", cc: "—", coordinador: "—", correo: "—" };
  const lista = pendientes.map((d) => `- ${d}`).join("\n");
  const obs = observaciones.length ? `Observaciones sobre lo que ya recibimos:\n${observaciones.map((o) => `- ${o}`).join("\n")}\n\n` : "";
  const vars = {
    docente: rec.docente,
    programa: rec.nombrePrograma || prog.nombre,
    modulo: rec.modulo,
    noOps: rec.noOPS || "N/A",
    pendientes: lista,
    observaciones: obs,
    usuario: config.usuarioActual,
  };
  return { asunto: fillTemplate(config.plantillaPendientesAsunto, vars), cuerpo: fillTemplate(config.plantillaPendientesCuerpo, vars), para: rec.correo || "", tipo: "pendientes" };
}

/* ------------------------------------------------------------------ */
/*  ILUSTRACIONES Y BANNERS (SVG propio, sin imágenes externas)         */
/* ------------------------------------------------------------------ */
function Arte({ tipo, height = 150 }) {
  const sombra = <ellipse cx="130" cy="144" rx="96" ry="6" fill="rgba(0,0,0,0.14)" />;
  const chispas = (
    <g fill="#fff" opacity="0.75">
      <circle cx="30" cy="40" r="3" /><circle cx="236" cy="28" r="2.5" /><circle cx="224" cy="104" r="3.5" /><circle cx="22" cy="104" r="2" />
      <path d="M240 60 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" /><path d="M18 70 l1.6 5 5 1.6 -5 1.6 -1.6 5 -1.6 -5 -5 -1.6 5 -1.6z" />
    </g>
  );
  let g = null;
  if (tipo === "academico") g = (
    <g>
      {sombra}
      <rect x="52" y="118" width="136" height="22" rx="4" fill="#FFD166" /><rect x="52" y="118" width="136" height="5" rx="2" fill="rgba(255,255,255,0.55)" />
      <rect x="64" y="96" width="116" height="22" rx="4" fill="#4CC9F0" /><rect x="64" y="96" width="116" height="5" rx="2" fill="rgba(255,255,255,0.55)" />
      <rect x="58" y="74" width="124" height="22" rx="4" fill="#F72585" /><rect x="58" y="74" width="124" height="5" rx="2" fill="rgba(255,255,255,0.45)" />
      <path d="M86 56 v16 c0 10 68 10 68 0 v-16 l-34 14z" fill="#2B2270" />
      <polygon points="120,10 196,32 120,54 44,32" fill="#1B1740" />
      <polygon points="120,10 196,32 120,36 44,32" fill="rgba(255,255,255,0.12)" />
      <path d="M196 32 v30" stroke="#FFD166" strokeWidth="3" strokeLinecap="round" /><circle cx="196" cy="66" r="5.5" fill="#FFD166" />
      {chispas}
    </g>
  );
  if (tipo === "contratos") g = (
    <g>
      {sombra}
      <rect x="56" y="16" width="112" height="124" rx="10" fill="rgba(255,255,255,0.35)" transform="rotate(-7 112 78)" />
      <rect x="76" y="10" width="112" height="128" rx="10" fill="#fff" />
      <rect x="76" y="10" width="112" height="26" rx="10" fill="#FFD166" /><rect x="76" y="26" width="112" height="10" fill="#FFD166" />
      <rect x="90" y="18" width="46" height="8" rx="4" fill="rgba(27,23,64,0.65)" />
      {[52, 66, 80, 94].map((y, i) => <rect key={y} x="90" y={y} width={i === 3 ? 52 : 84} height="6" rx="3" fill="#D9D7E8" />)}
      <circle cx="166" cy="112" r="22" fill="#14946A" /><circle cx="166" cy="112" r="17" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M156 112 l7 7 14 -15" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="rotate(38 206 56)"><rect x="196" y="22" width="14" height="70" rx="4" fill="#FF8C42" /><polygon points="196,92 210,92 203,106" fill="#1B1740" /><rect x="196" y="22" width="14" height="10" rx="4" fill="#F72585" /></g>
      {chispas}
    </g>
  );
  if (tipo === "pagos") g = (
    <g>
      {sombra}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}><rect x="40" y={110 - i * 15} width="84" height="14" fill="#E8A400" /><ellipse cx="82" cy={124 - i * 15} rx="42" ry="12" fill="#E8A400" /><ellipse cx="82" cy={110 - i * 15} rx="42" ry="12" fill="#FFD166" /><ellipse cx="82" cy={110 - i * 15} rx="30" ry="7.5" fill="none" stroke="#E8A400" strokeWidth="2" /></g>
      ))}
      <g transform="rotate(-8 180 96)"><rect x="132" y="62" width="104" height="60" rx="8" fill="#2EC4B6" /><rect x="132" y="62" width="104" height="60" rx="8" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 4" opacity="0.7" /><circle cx="184" cy="92" r="17" fill="rgba(255,255,255,0.9)" /><text x="184" y="99" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0E7C70" fontFamily="Figtree, sans-serif">$</text></g>
      <path d="M150 40 l24 -16 20 10 30 -22" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><path d="M214 8 h14 v14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {chispas}
    </g>
  );
  if (tipo === "programas") g = (
    <g>
      {sombra}
      <polygon points="130,12 214,52 46,52" fill="#fff" /><polygon points="130,12 214,52 130,52" fill="rgba(27,23,64,0.08)" />
      <circle cx="130" cy="36" r="8" fill="#5B45D6" />
      {[64, 88, 112, 142, 166, 190].map((x) => <g key={x}><rect x={x - 6} y="60" width="12" height="62" rx="2" fill="#fff" /><rect x={x - 6} y="60" width="5" height="62" rx="2" fill="rgba(27,23,64,0.08)" /></g>)}
      <rect x="44" y="122" width="172" height="8" rx="2" fill="#fff" /><rect x="34" y="130" width="192" height="10" rx="3" fill="#FFD166" />
      <path d="M130 12 v-8" stroke="#fff" strokeWidth="2.5" /><path d="M130 4 h16 l-4 5 4 5 h-16z" fill="#F72585" />
      {chispas}
    </g>
  );
  if (tipo === "datos") g = (
    <g>
      {sombra}
      <rect x="40" y="26" width="150" height="108" rx="10" fill="#fff" />
      <rect x="40" y="26" width="150" height="24" rx="10" fill="#14946A" /><rect x="40" y="40" width="150" height="10" fill="#14946A" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={48 + c * 35} y={58 + r * 24} width="30" height="16" rx="3" fill={r === 1 && c === 2 ? "#FFD166" : "#EDEBF7"} />))}
      <text x="52" y="43" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Figtree, sans-serif">Excel</text>
      <circle cx="206" cy="58" r="26" fill="#F72585" /><path d="M206 70 v-24 m-11 11 l11 -11 11 11" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="206" cy="112" r="20" fill="#4CC9F0" /><path d="M206 102 v20 m-10 -9 l10 10 10 -10" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {chispas}
    </g>
  );
  if (tipo === "ajustes") g = (
    <g>
      {sombra}
      <circle cx="92" cy="76" r="44" fill="none" stroke="#fff" strokeWidth="14" strokeDasharray="13.4 13.4" />
      <circle cx="92" cy="76" r="38" fill="#fff" /><circle cx="92" cy="76" r="15" fill="#5B45D6" />
      {[[158, 40, 0.3, "#FFD166"], [158, 76, 0.7, "#4CC9F0"], [158, 112, 0.5, "#F72585"]].map(([x, y, p, c]) => (
        <g key={y}><rect x={x} y={y - 3} width="80" height="6" rx="3" fill="rgba(255,255,255,0.55)" /><rect x={x} y={y - 3} width={80 * p} height="6" rx="3" fill="#fff" /><circle cx={x + 80 * p} cy={y} r="9" fill={c} stroke="#fff" strokeWidth="3" /></g>
      ))}
      {chispas}
    </g>
  );
  return <svg viewBox="0 0 260 150" height={height} style={{ display: "block" }} aria-hidden="true">{g}</svg>;
}

function Banner({ titulo, subtitulo, arte, desde = "#5B45D6", hasta = "#C026D3", children, grande = false }) {
  return (
    <div className="ops-fade-in" style={{ position: "relative", overflow: "hidden", borderRadius: 26, padding: grande ? "32px 36px" : "24px 30px", color: "#fff", background: `linear-gradient(120deg, ${desde} 0%, ${hasta} 100%)`, boxShadow: "0 14px 34px rgba(27,23,64,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, minHeight: grande ? 190 : 128 }}>
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: 999, background: "rgba(255,255,255,0.10)", top: -120, right: 120 }} />
      <div style={{ position: "absolute", width: 180, height: 180, borderRadius: 999, background: "rgba(255,255,255,0.08)", bottom: -90, left: "38%" }} />
      <div style={{ position: "relative", minWidth: 0, flex: 1 }}>
        <div className="font-display" style={{ fontSize: grande ? 38 : 30, fontWeight: 700, lineHeight: 1.05 }}>{titulo}</div>
        {subtitulo && <div style={{ fontSize: grande ? 16 : 14.5, opacity: 0.92, marginTop: 8, maxWidth: 560, lineHeight: 1.4 }}>{subtitulo}</div>}
        {children}
      </div>
      <div className="ops-arte" style={{ position: "relative", flexShrink: 0 }}><Arte tipo={arte} height={grande ? 170 : 130} /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  UI ATOMS                                                            */
/* ------------------------------------------------------------------ */
function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "var(--paper-raised)", fg: "var(--ink-soft)", bd: "var(--line-strong)" },
    moss: { bg: "var(--moss-soft)", fg: "var(--moss)", bd: "var(--moss)" },
    gold: { bg: "var(--gold-soft)", fg: "var(--gold)", bd: "var(--gold)" },
    brick: { bg: "var(--brick-soft)", fg: "var(--brick)", bd: "var(--brick)" },
    amber: { bg: "var(--amber-soft)", fg: "var(--amber)", bd: "var(--amber)" },
  };
  const t = tones[tone];
  return (
    <span className="font-body" style={{ background: t.bg, color: t.fg, border: "none", borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function UrgTone(level) {
  return { red: "brick", orange: "amber", amber: "amber", yellow: "gold", green: "moss", done: "neutral" }[level];
}

const KPI_COLORES = {
  violet: ["#5B45D6", "#8B5CF6"], amber: ["#F59E0B", "#F97316"], coral: ["#EF4444", "#F43F5E"], fuchsia: ["#C026D3", "#EC4899"],
  blue: ["#2563EB", "#38BDF8"], teal: ["#0D9488", "#2DD4BF"], indigo: ["#4338CA", "#6366F1"], green: ["#15803D", "#34D399"],
};
function KPI({ icon: Icon, label, value, tone }) {
  const [a, b] = KPI_COLORES[tone] || KPI_COLORES.violet;
  return (
    <div className="font-body ops-kpi" style={{ background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)` }}>
      <Icon size={84} strokeWidth={1.4} style={{ position: "absolute", right: -10, bottom: -14, opacity: 0.18 }} />
      <div style={{ position: "relative", fontSize: 13, fontWeight: 600, opacity: 0.95, display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(255,255,255,0.22)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={15} /></span>
        <span style={{ minWidth: 0 }}>{label}</span>
      </div>
      <span className="font-display" style={{ position: "relative", fontSize: 44, fontWeight: 700, lineHeight: 1, display: "block", marginTop: 16 }}>{value}</span>
    </div>
  );
}

function MultiSelect({ label, options, selected, onChange }) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const text = selected.length === 0 ? `${label}: Todos` : `${label}: ${selected.length} seleccionado${selected.length > 1 ? "s" : ""}`;
  return (
    <details className="font-body" style={{ position: "relative" }}>
      <summary style={{ ...selStyle, display: "inline-flex", alignItems: "center", gap: 6, userSelect: "none" }}>
        {text} <ChevronDown size={13} style={{ opacity: 0.6 }} />
      </summary>
      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "var(--paper-raised)", border: "1px solid var(--line-strong)", borderRadius: 10, padding: 8, minWidth: 210, zIndex: 30, boxShadow: "var(--shadow-md)", maxHeight: 280, overflowY: "auto" }}>
        {selected.length > 0 && (
          <button onClick={() => onChange([])} style={{ fontSize: 11.5, color: "var(--brick)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px", marginBottom: 4 }}>
            Limpiar selección
          </button>
        )}
        {opts.map((o) => (
          <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 4px", fontSize: 12.5, cursor: "pointer" }}>
            <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </details>
  );
}

const selStyle = { padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", fontSize: 13 };
const tdStyle = { padding: "12px 14px", verticalAlign: "top" };
const inputStyle = { boxSizing: "border-box", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", fontSize: 13, fontFamily: "inherit", width: "100%" };
const cardStyle = { background: "var(--paper-raised)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", borderRadius: 18, padding: 20 };
const sectionTitle = { fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 12 };

/* ------------------------------------------------------------------ */
/*  MAIN APP                                                            */
/* ------------------------------------------------------------------ */
export default function App() {
  const [config, setConfig] = useState(CONFIG_DEFAULT);
  const [tarifas, setTarifas] = useState(TARIFAS_DEFAULT);
  const [programas, setProgramas] = useState(PROGRAMAS_DEFAULT);
  const [records, setRecords] = useState(RECORDS_INICIALES);
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);
  const [gestionPantallaCompleta, setGestionPantallaCompleta] = useState(false);
  const [search, setSearch] = useState("");
  const [fTipo, setFTipo] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ops-filtro-tipo")) || []; } catch (e) { return []; }
  });
  const [fEstado, setFEstado] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ops-filtro-estado")) || []; } catch (e) { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("ops-filtro-tipo", JSON.stringify(fTipo)); } catch (e) { /* almacenamiento no disponible */ }
  }, [fTipo]);
  useEffect(() => {
    try { localStorage.setItem("ops-filtro-estado", JSON.stringify(fEstado)); } catch (e) { /* almacenamiento no disponible */ }
  }, [fEstado]);
  const [toast, setToast] = useState(null);
  const [emailDraft, setEmailDraft] = useState(null);
  const [masivoDraft, setMasivoDraft] = useState(null);
  const [ready, setReady] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [borrados, setBorrados] = useState([]); // [{id, _v}] registros eliminados, para no "resucitarlos" al fusionar
  const [borradorPagos, setBorradorPagos] = useState([]); // tabla independiente "Borrador de Pagos"
  const [borradorPagosBorrados, setBorradorPagosBorrados] = useState([]);
  const [diag, setDiag] = useState({ ultimaCarga: null, ultimoGuardado: null, storageCount: null, reactCount: null, recuperados: 0, checking: false, ultimoResultado: "" });

  const STORAGE_KEY = "ops-app-state-v1";

  // Cargar datos guardados al abrir la aplicación
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        if (!window.storage) { setReady(true); return; }
        const res = await window.storage.get(STORAGE_KEY, false);
        if (!cancelado && res && res.value) {
          const data = JSON.parse(res.value);
          if (data.records) setRecords(data.records.map((r) => ({ _v: 0, ...r, escalafon: normalizarEscalafon(r.escalafon) })));
          if (data.borrados) setBorrados(data.borrados);
          if (data.borradorPagos) setBorradorPagos(data.borradorPagos.map((b) => ({ _v: 0, ...b })));
          if (data.borradorPagosBorrados) setBorradorPagosBorrados(data.borradorPagosBorrados);
          if (data.config) setConfig({ ...CONFIG_DEFAULT, ...data.config });
          // Migración: si las tarifas guardadas son de un modelo anterior (solo por
          // escalafón, o solo por tipo de programa, sin ambos campos a la vez), se
          // descartan y se usan las tarifas por defecto (tipo de programa + categoría)
          // para no dejar el cálculo automático roto. Tus registros NO se tocan.
          const tarifasValidas = Array.isArray(data.tarifas) && data.tarifas.length > 0 && data.tarifas.every((t) => typeof t.tipoPrograma === "string" && t.tipoPrograma.trim() !== "" && typeof t.categoria === "string" && t.categoria.trim() !== "");
          if (!tarifasValidas) {
            setTarifas(TARIFAS_DEFAULT);
            if (data.tarifas) setTimeout(() => notify("Se actualizó la tabla de tarifas al modelo por tipo de programa + categoría"), 300);
          } else {
            const { resultado, cambios } = actualizarTarifasSinTocarPersonalizadas(data.tarifas);
            setTarifas(resultado);
            if (cambios > 0) setTimeout(() => notify(`Se actualizaron ${cambios} tarifa(s) a los nuevos valores`), 300);
          }
          if (data.programas) {
            let progs = data.programas;
            let yaMigrado = false;
            try { yaMigrado = localStorage.getItem("ops-migracion-edco-v1") === "1"; } catch (e) { /* sin acceso */ }
            if (!yaMigrado && !progs.some(esEdco)) {
              progs = [...progs, PROGRAMA_EDCO];
              setTimeout(() => notify("Se agregó el programa EDCO al catálogo (complétale PA, centro de costos y coordinador en Programas)"), 400);
            }
            try { localStorage.setItem("ops-migracion-edco-v1", "1"); } catch (e) { /* sin acceso */ }
            setProgramas(progs);
          }
          setDiag((d) => ({ ...d, ultimaCarga: new Date(), storageCount: Array.isArray(data.records) ? data.records.length : 0 }));
        }
      } catch (e) {
        // No hay datos guardados todavía: se quedan los datos de ejemplo
      } finally {
        if (!cancelado) setReady(true);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  // Fusiona una colección remota con una local, registro por registro, quedándose
  // con la versión más reciente (por _v) en cada caso, y respetando los borrados
  // (tumbas) más recientes que la versión que quedó. Se usa tanto para "records"
  // como para "borradorPagos" — son colecciones totalmente independientes entre sí.
  function fusionarColeccion(remotos, remTumbas, locales, localTumbas) {
    const tumbas = new Map();
    [...remTumbas, ...localTumbas].forEach((b) => {
      const prev = tumbas.get(b.id);
      if (!prev || b._v > prev._v) tumbas.set(b.id, b);
    });
    const byId = new Map();
    remotos.forEach((r) => byId.set(r.id, r));
    locales.forEach((r) => {
      const rem = byId.get(r.id);
      if (!rem || (r._v || 0) >= (rem._v || 0)) byId.set(r.id, r);
    });
    tumbas.forEach((t, id) => {
      const rec = byId.get(id);
      if (rec && t._v >= (rec._v || 0)) byId.delete(id);
    });
    return { items: [...byId.values()], tumbas: [...tumbas.values()] };
  }

  // Fusiona lo que hay en el almacenamiento con lo que esta pestaña tiene en memoria
  // (tanto los registros de OPS/Bonificaciones como el Borrador de Pagos, cada uno
  // por separado), en vez de sobrescribir todo a ciegas. Así, si otra pestaña/instancia
  // de esta misma app guardó algo mientras tanto, no se pierde.
  async function fusionarYGuardar(recordsLocales, borradosLocales, borradorLocales, borradorBorradosLocales, configLocal, tarifasLocal, programasLocal) {
    let remoto = null;
    try {
      const actual = await window.storage.get(STORAGE_KEY, false);
      if (actual && actual.value) remoto = JSON.parse(actual.value);
    } catch (e) { /* no había nada guardado aún */ }

    const remRecords = Array.isArray(remoto?.records) ? remoto.records : [];
    const remBorrados = Array.isArray(remoto?.borrados) ? remoto.borrados : [];
    const remBorrador = Array.isArray(remoto?.borradorPagos) ? remoto.borradorPagos : [];
    const remBorradorBorrados = Array.isArray(remoto?.borradorPagosBorrados) ? remoto.borradorPagosBorrados : [];

    const registrosFusion = fusionarColeccion(remRecords, remBorrados, recordsLocales, borradosLocales);
    const borradorFusion = fusionarColeccion(remBorrador, remBorradorBorrados, borradorLocales, borradorBorradosLocales);

    await window.storage.set(STORAGE_KEY, JSON.stringify({
      records: registrosFusion.items,
      borrados: registrosFusion.tumbas,
      borradorPagos: borradorFusion.items,
      borradorPagosBorrados: borradorFusion.tumbas,
      config: configLocal, tarifas: tarifasLocal, programas: programasLocal,
    }), false);

    return { records: registrosFusion.items, borradorPagos: borradorFusion.items };
  }

  // Refrescar desde el almacenamiento: si se editó desde otro dispositivo o pestaña,
  // al volver a esta ventana (o cada 20 s) se traen los cambios y el tablero se actualiza.
  const estadoRef = React.useRef(null);
  estadoRef.current = { records, borrados, borradorPagos, borradorPagosBorrados };
  async function refrescarDesdeAlmacenamiento() {
    try {
      if (!window.storage) return;
      const res = await window.storage.get(STORAGE_KEY, false);
      if (!res || !res.value) return;
      const rem = JSON.parse(res.value);
      const e = estadoRef.current;
      const f1 = fusionarColeccion(Array.isArray(rem.records) ? rem.records : [], Array.isArray(rem.borrados) ? rem.borrados : [], e.records, e.borrados);
      const f2 = fusionarColeccion(Array.isArray(rem.borradorPagos) ? rem.borradorPagos : [], Array.isArray(rem.borradorPagosBorrados) ? rem.borradorPagosBorrados : [], e.borradorPagos, e.borradorPagosBorrados);
      const huella = (a) => a.map((x) => x.id + ":" + (x._v || 0)).sort().join("|");
      if (huella(f1.items) !== huella(e.records)) { setRecords(f1.items); setBorrados(f1.tumbas); }
      if (huella(f2.items) !== huella(e.borradorPagos)) { setBorradorPagos(f2.items); setBorradorPagosBorrados(f2.tumbas); }
    } catch (err) { /* sin conexión: se intenta de nuevo luego */ }
  }
  useEffect(() => {
    if (!ready) return;
    const alVolver = () => { if (document.visibilityState === "visible") refrescarDesdeAlmacenamiento(); };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    const t = setInterval(alVolver, 20000);
    return () => { document.removeEventListener("visibilitychange", alVolver); window.removeEventListener("focus", alVolver); clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Guardar automáticamente cada vez que algo cambia (con una pequeña espera para no saturar)
  useEffect(() => {
    if (!ready || !window.storage) return;
    setGuardando(true);
    const t = setTimeout(async () => {
      try {
        const fusion = await fusionarYGuardar(records, borrados, borradorPagos, borradorPagosBorrados, config, tarifas, programas);
        const diferencia = fusion.records.length - records.length;
        if (diferencia !== 0) {
          setRecords(fusion.records);
          if (diferencia > 0) notify(`Se recuperaron ${diferencia} registro(s) guardado(s) desde otra sesión`);
        }
        if (fusion.borradorPagos.length !== borradorPagos.length) {
          setBorradorPagos(fusion.borradorPagos);
        }
        setDiag((d) => ({ ...d, ultimoGuardado: new Date(), storageCount: fusion.records.length, reactCount: fusion.records.length }));
      } catch (e) {
        notify("No se pudo guardar el último cambio, revisa tu conexión");
      } finally {
        setGuardando(false);
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, records, borrados, borradorPagos, borradorPagosBorrados, config, tarifas, programas]);

  async function verificarConsistencia() {
    setDiag((d) => ({ ...d, checking: true }));
    try {
      if (!window.storage) { setDiag((d) => ({ ...d, checking: false, ultimoResultado: "Almacenamiento no disponible en este entorno" })); return; }
      const res = await window.storage.get(STORAGE_KEY, false);
      const data = res && res.value ? JSON.parse(res.value) : { records: [] };
      const remotos = Array.isArray(data.records) ? data.records : [];
      const idsLocales = new Set(records.map((r) => r.id));
      const faltantes = remotos.filter((r) => !idsLocales.has(r.id));
      if (faltantes.length > 0) {
        setRecords((rs) => [...rs, ...faltantes]);
        setDiag((d) => ({ ...d, checking: false, storageCount: remotos.length, reactCount: records.length + faltantes.length, recuperados: d.recuperados + faltantes.length, ultimoResultado: `Se encontraron y recuperaron ${faltantes.length} registro(s) que no se estaban mostrando` }));
        notify(`Se recuperaron ${faltantes.length} registro(s) que no se estaban mostrando`);
      } else {
        setDiag((d) => ({ ...d, checking: false, storageCount: remotos.length, reactCount: records.length, ultimoResultado: "Todo consistente: React y el almacenamiento coinciden" }));
      }
    } catch (e) {
      setDiag((d) => ({ ...d, checking: false, ultimoResultado: "No se pudo verificar (revisa tu conexión)" }));
    }
  }

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  function reiniciar() {
    setConfig(CONFIG_DEFAULT);
    setTarifas(TARIFAS_DEFAULT);
    setProgramas(PROGRAMAS_DEFAULT);
    setRecords(RECORDS_INICIALES.map((r) => ({ ...r })));
    setBorrados([]);
    notify("Datos de ejemplo restaurados");
  }

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (fTipo.length && !fTipo.includes(r.tipo)) return false;
      if (fEstado.length && !fEstado.includes(r.estado)) return false;
      const s = search.trim().toLowerCase();
      if (!s) return true;
      return [r.noOPS, r.docente, r.programa, r.nombrePrograma, r.modulo, r.correo].filter(Boolean).some((v) => v.toLowerCase().includes(s));
    });
  }, [records, fTipo, fEstado, search]);

  const kpis = useMemo(() => ({
    opsActivas: records.filter((r) => r.tipo === "OPS" && r.estado !== "Pagado").length,
    proximos: records.filter((r) => { const d = daysDiff(r.fechaFin); return r.estado !== "Pagado" && d >= 0 && d <= 7; }).length,
    finalizadosPendientes: records.filter((r) => r.estado !== "Pagado" && daysDiff(r.fechaFin) < 0).length,
    documentosPendientes: records.filter((r) => r.tipo === "OPS" && r.estado !== "Pagado" && docsPct(r) < 100).length,
    vistosBuenos: records.filter((r) => r.estado.startsWith("Visto Bueno") || r.estado === "Visto Bueno solicitado").length,
    opsPendientesPago: records.filter((r) => r.tipo === "OPS" && r.estado === "Pendiente de pago").length,
    bonificacionesPendientes: records.filter((r) => r.tipo === "BONIFICACION" && r.estado !== "Pagado").length,
    pagosRealizados: records.filter((r) => r.estado === "Pagado").length,
  }), [records]);

  const tareasHoy = useMemo(() => {
    return records.map((r) => ({ r, t: tareaSugerida(r) })).filter((x) => x.t).sort((a, b) => a.t.prioridad - b.t.prioridad || daysDiff(a.r.fechaFin) - daysDiff(b.r.fechaFin));
  }, [records]);

  function updateDoc(recId, key, next) {
    setRecords((rs) => rs.map((r) => r.id === recId ? { ...r, documentos: { ...r.documentos, [key]: next }, _v: Date.now() } : r));
    setSelected((s) => s && s.id === recId ? { ...s, documentos: { ...s.documentos, [key]: next }, _v: Date.now() } : s);
  }

  function vaciarRegistros() {
    const ahora = Date.now();
    const ids = new Set(records.map((r) => r.id));
    setBorrados((bs) => [...bs.filter((b) => !ids.has(b.id)), ...records.map((r) => ({ id: r.id, _v: ahora }))]);
    setRecords([]);
    notify("Se eliminaron todos los registros");
  }

  function deleteRecord(id) {
    setBorrados((bs) => [...bs.filter((b) => b.id !== id), { id, _v: Date.now() }]);
    setRecords((rs) => rs.filter((r) => r.id !== id));
    setSelected(null);
    notify("Registro eliminado");
  }

  // Auditor: hallazgos calculados por reglas; "revisados" se recuerda en este navegador
  const [auditRevisados, setAuditRevisados] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gops-auditor-revisados")) || []; } catch (e) { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("gops-auditor-revisados", JSON.stringify(auditRevisados.slice(-500))); } catch (e) { /* almacenamiento no disponible */ }
  }, [auditRevisados]);
  const hallazgos = useMemo(() => auditarRegistros(records, tarifas, programas, config), [records, tarifas, programas, config]);
  const hallazgosPendientes = useMemo(() => hallazgos.filter((h) => !auditRevisados.includes(h.key)), [hallazgos, auditRevisados]);

  function advanceEstado(recId) {
    setRecords((rs) => rs.map((r) => {
      if (r.id !== recId) return r;
      const seq = ESTADOS[r.tipo];
      const i = idxEstado(r.tipo, r.estado);
      const next = i < 0 ? seq[0] : i < seq.length - 1 ? seq[i + 1] : r.estado;
      return { ...r, estado: next, _v: Date.now() };
    }));
    setSelected((s) => {
      if (!s || s.id !== recId) return s;
      const seq = ESTADOS[s.tipo];
      const i = idxEstado(s.tipo, s.estado);
      const next = i < 0 ? seq[0] : i < seq.length - 1 ? seq[i + 1] : s.estado;
      return { ...s, estado: next, _v: Date.now() };
    });
  }

  function retrocederEstado(recId) {
    setRecords((rs) => rs.map((r) => {
      if (r.id !== recId) return r;
      const seq = ESTADOS[r.tipo];
      const i = idxEstado(r.tipo, r.estado);
      const prev = i > 0 ? seq[i - 1] : r.estado;
      return { ...r, estado: prev, _v: Date.now() };
    }));
    setSelected((s) => {
      if (!s || s.id !== recId) return s;
      const seq = ESTADOS[s.tipo];
      const i = idxEstado(s.tipo, s.estado);
      const prev = i > 0 ? seq[i - 1] : s.estado;
      return { ...s, estado: prev, _v: Date.now() };
    });
  }

  // ---- Borrador de Pagos: tabla independiente, nunca toca "records" ----
  function agregarBorrador() {
    const hoy = HOY.toISOString().slice(0, 10);
    const nuevo = { id: generarId(), _v: Date.now(), tipo: "OPS", docente: "", valor: 0, fechaFin: hoy, fechaEnvioOps: hoy };
    setBorradorPagos((bs) => [nuevo, ...bs]);
    return nuevo.id;
  }
  function actualizarBorrador(id, campo, valor) {
    setBorradorPagos((bs) => bs.map((b) => b.id === id ? { ...b, [campo]: valor, _v: Date.now() } : b));
  }
  function eliminarBorrador(id) {
    setBorradorPagosBorrados((bs) => [...bs.filter((x) => x.id !== id), { id, _v: Date.now() }]);
    setBorradorPagos((bs) => bs.filter((b) => b.id !== id));
    notify("Registro eliminado del borrador");
  }
  function enviarABorrador(seleccionados) {
    const hoy = HOY.toISOString().slice(0, 10);
    const nuevos = seleccionados.map((r) => ({
      id: generarId(), _v: Date.now(),
      tipo: r.tipo, docente: r.docente, valor: valorTotal(r), fechaFin: r.fechaFin, fechaEnvioOps: hoy,
    }));
    setBorradorPagos((bs) => [...nuevos, ...bs]);
    notify(`${nuevos.length} registro${nuevos.length === 1 ? "" : "s"} copiado${nuevos.length === 1 ? "" : "s"} al Borrador de Pagos`);
  }

  function aplicarValoresHora(cambios) {
    if (!cambios.length) return;
    const porId = new Map(cambios.map((c) => [c.id, c.valorHora]));
    setRecords((rs) => rs.map((r) => porId.has(r.id) ? { ...r, valorHora: porId.get(r.id), _v: Date.now() } : r));
    notify(`Se actualizó el valor hora de ${cambios.length} registro${cambios.length === 1 ? "" : "s"}`);
  }

  function generarCorreoMasivo(seleccionados) {
    if (seleccionados.length === 0) return;
    const mes = HOY.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    const ordenados = [...seleccionados].sort((a, b) => a.docente.localeCompare(b.docente));
    const lineas = ordenados.map((r, i) => `${i + 1}. ${r.docente} — ${r.nombrePrograma || r.programa} — ${r.modulo} — Finaliza: ${fmtDate(r.fechaFin)} — ${COP(valorTotal(r))}`).join("\n");
    const total = ordenados.reduce((acc, r) => acc + valorTotal(r), 0);
    const soloBonif = ordenados.every((r) => r.tipo === "BONIFICACION");
    const tipoTexto = soloBonif ? "bonificaciones" : "OPS y bonificaciones";
    const asunto = `Relación de ${tipoTexto} – ${mes} – visto bueno y envío a nómina`;
    const cuerpo = `Buen día, Decana ${config.decanaNombre}.

De acuerdo con el visto bueno ya emitido por los coordinadores de cada programa, envío la relación de ${tipoTexto} correspondientes a ${mes} para su aprobación y envío a nómina:

${lineas}

Total ${ordenados.length} registro${ordenados.length === 1 ? "" : "s"}: ${COP(total)}

Agradezco su aprobación para continuar con el proceso.

Cordialmente,
${config.usuarioActual}`;
    setMasivoDraft({ asunto, cuerpo, para: config.decanaCorreo });
  }

  if (!ready) {
    return (
      <div className="font-body" style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)", fontSize: 13.5 }}>
        <style>{FONTS}{TOKENS}</style>
        Cargando tu información guardada…
      </div>
    );
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "gestion", label: "OPS y Bonificaciones", icon: Table2 },
    { id: "borrador", label: "Borrador de Pagos", icon: ClipboardList },
    { id: "auditor", label: "Auditor", icon: ShieldCheck, badge: hallazgosPendientes.filter((h) => h.sev !== "baja").length },
    { id: "programas", label: "Programas", icon: GraduationCap },
    { id: "importar", label: "Importar / Exportar", icon: Upload },
    { id: "configuracion", label: "Administración", icon: Settings },
  ];

  return (
    <div className="font-body" style={{ minHeight: "100vh", background: "radial-gradient(900px 420px at 85% -80px, rgba(192,38,211,0.10), transparent 70%), radial-gradient(700px 400px at 20% 0, rgba(91,69,214,0.08), transparent 70%), var(--paper)", color: "var(--ink)", display: "flex" }}>
      <style>{FONTS}{TOKENS}</style>

      {/* BACKDROP (mobile) */}
      <div className={`ops-backdrop${mobileOpen ? " visible" : ""}`} onClick={() => setMobileOpen(false)} />

      {/* SIDEBAR */}
      {!gestionPantallaCompleta && (
        <aside className={`ops-sidebar${mobileOpen ? " mobile-open" : ""}`} style={{ width: sidebarCollapsed ? 76 : 220, flexShrink: 0, background: "linear-gradient(175deg, #2A1B6E 0%, #4B2FB8 55%, #8B2FC9 100%)", color: "#fff", padding: sidebarCollapsed ? "22px 12px" : "22px 16px", display: "flex", flexDirection: "column", gap: 24, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            {!sidebarCollapsed && (
              <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, #FFD166, #FF8C42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 6px 14px rgba(0,0,0,0.25)" }}><GraduationCap size={21} style={{ color: "#1B1740" }} /></div>
                <div style={{ minWidth: 0 }}>
                  <div className="font-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1, whiteSpace: "nowrap", letterSpacing: 1 }}>GOPS</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2, lineHeight: 1.2 }}>Gestión de OPS y Bonificaciones de Posgrados</div>
                </div>
              </div>
            )}
            <button className="ops-desktop-collapse" onClick={() => setSidebarCollapsed((v) => !v)} title={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
              style={{ display: "none", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", flexShrink: 0 }}>
              {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
            <button onClick={() => setMobileOpen(false)} title="Cerrar menú"
              style={{ display: mobileOpen ? "flex" : "none", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV.map((item) => (
              <button key={item.id} className="ops-nav-item" onClick={() => { setView(item.id); setMobileOpen(false); }} title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "10px 0" : "9px 10px", borderRadius: 9, border: "none", cursor: "pointer",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  background: view === item.id ? "#fff" : "transparent",
                  color: view === item.id ? "#4B2FB8" : "rgba(255,255,255,0.82)", fontSize: 14, fontWeight: view === item.id ? 700 : 500, textAlign: "left", whiteSpace: "nowrap",
                }}>
                <item.icon size={16} style={{ flexShrink: 0 }} />{!sidebarCollapsed && item.label}
                {!sidebarCollapsed && item.badge > 0 && <span style={{ marginLeft: "auto", background: "#EF4444", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{item.badge}</span>}
              </button>
            ))}
          </nav>
          <button onClick={() => setShowNew(true)} className="font-body" title={sidebarCollapsed ? "Nuevo registro" : undefined} style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "linear-gradient(135deg, #FFD166, #FF8C42)", color: "#1B1740", border: "none", borderRadius: 12, padding: "12px 12px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 8px 18px rgba(0,0,0,0.25)" }}>
            <Plus size={15} /> {!sidebarCollapsed && "Nuevo registro"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.8, justifyContent: "center", whiteSpace: "nowrap" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: guardando ? "var(--gold)" : "var(--moss)", flexShrink: 0 }} />
            {!sidebarCollapsed && (guardando ? "Guardando…" : "Todo guardado")}
          </div>
        </aside>
      )}

      {/* MAIN */}
      <main className="ops-main" style={{ flex: 1, minWidth: 0, padding: gestionPantallaCompleta ? "18px 20px 40px" : "26px 32px 60px" }}>
        {!gestionPantallaCompleta && (
          <button className="ops-hamburger" onClick={() => setMobileOpen(true)}
            style={{ position: "fixed", top: 14, left: 14, zIndex: 40, alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", boxShadow: "var(--shadow-sm)", cursor: "pointer" }}>
            <Menu size={17} style={{ color: "var(--ink)" }} />
          </button>
        )}
        {view === "dashboard" && (
          <DashboardView kpis={kpis} tareasHoy={tareasHoy} records={records} onOpen={setSelected} usuario={config.usuarioActual} />
        )}
        {view === "gestion" && (
          <GestionView
            filtered={filtered} search={search} setSearch={setSearch}
            fTipo={fTipo} setFTipo={setFTipo} fEstado={fEstado} setFEstado={setFEstado}
            onOpen={setSelected} config={config} onEnviarABorrador={enviarABorrador} onGenerarMasivo={generarCorreoMasivo}
            records={records} programas={programas} tarifas={tarifas} onAplicarValores={aplicarValoresHora}
            pantallaCompleta={gestionPantallaCompleta} setPantallaCompleta={setGestionPantallaCompleta}
          />
        )}
        {view === "borrador" && <BorradorPagosView items={borradorPagos} onAdd={agregarBorrador} onUpdate={actualizarBorrador} onDelete={eliminarBorrador} />}
        {view === "auditor" && <AuditorView hallazgos={hallazgos} revisados={auditRevisados} setRevisados={setAuditRevisados} onOpen={(id) => setSelected(records.find((r) => r.id === id) || null)} notify={notify} />}
        {view === "programas" && <ProgramasView programas={programas} setProgramas={setProgramas} tarifas={tarifas} notify={notify} />}
        {view === "importar" && <ImportarView records={records} setRecords={setRecords} config={config} tarifas={tarifas} programas={programas} notify={notify} />}
        {view === "configuracion" && <ConfiguracionView config={config} setConfig={setConfig} tarifas={tarifas} setTarifas={setTarifas} programas={programas} onReset={reiniciar} onVaciar={vaciarRegistros} notify={notify} diag={diag} recordsCount={records.length} onVerificar={verificarConsistencia} />}
      </main>

      {/* DETAIL DRAWER */}
      {selected && (
        <DetailDrawer
          rec={selected}
          config={config}
          programas={programas}
          hallazgos={hallazgosPendientes.filter((h) => h.recId === selected.id)}
          onIrAuditor={() => { setSelected(null); setEmailDraft(null); setView("auditor"); }}
          onClose={() => { setSelected(null); setEmailDraft(null); }}
          onUpdateDoc={updateDoc}
          onAdvance={advanceEstado}
          onRetroceder={retrocederEstado}
          onEdit={(rec) => { setSelected(null); setEmailDraft(null); setEditing(rec); }}
          onDelete={deleteRecord}
          emailDraft={emailDraft}
          setEmailDraft={setEmailDraft}
          onSend={() => { notify("Se intentó abrir tu app de correo"); setEmailDraft(null); }}
          onDraft={() => notify("Borrador guardado")}
          onCopy={(ok) => notify(ok ? "Mensaje copiado al portapapeles" : "No se pudo copiar automáticamente: selecciona el texto y cópialo manualmente")}
        />
      )}

      {/* NEW / EDIT RECORD MODAL */}
      {showNew && (
        <RecordModal
          config={config}
          tarifas={tarifas}
          programas={programas}
          record={null}
          onClose={() => setShowNew(false)}
          onSave={(data) => { setRecords((rs) => [mkRecord(data, config, tarifas, programas), ...rs]); setShowNew(false); notify("Registro creado"); }}
        />
      )}
      {editing && (
        <RecordModal
          config={config}
          tarifas={tarifas}
          programas={programas}
          record={editing}
          onClose={() => setEditing(null)}
          onDelete={deleteRecord}
          onSave={(data) => {
            setRecords((rs) => rs.map((r) => r.id === editing.id ? { ...r, ...data, _v: Date.now() } : r));
            setEditing(null);
            notify("Registro actualizado");
          }}
        />
      )}

      {/* CORREO MASIVO A LA DECANA */}
      {masivoDraft && (
        <MasivoModal
          draft={masivoDraft}
          setDraft={setMasivoDraft}
          onClose={() => setMasivoDraft(null)}
          onSend={() => { notify("Se intentó abrir tu app de correo"); setMasivoDraft(null); }}
          onCopy={(ok) => notify(ok ? "Mensaje copiado al portapapeles" : "No se pudo copiar automáticamente: selecciona el texto y cópialo manualmente")}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div className="font-body" style={{ position: "fixed", bottom: 24, right: 28, background: "var(--ink)", color: "#fff", padding: "12px 18px", borderRadius: 10, fontSize: 13.5, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 8, zIndex: 80 }}>
          <CheckCircle2 size={16} style={{ color: "#8FD6B0" }} /> {toast}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DASHBOARD                                                           */
/* ------------------------------------------------------------------ */
const CHART_COLORS = { activas: "#5B45D6", proximas: "#D9791A", finalizadas: "#14946A", vencidas: "#D6334A" };

function claseEstadoOPS(r) {
  if (r.estado === "Pagado") return "finalizadas";
  const d = daysDiff(r.fechaFin);
  if (d < 0) return "vencidas";
  if (d <= 7) return "proximas";
  return "activas";
}

function DashboardView({ kpis, tareasHoy, records, onOpen, usuario }) {
  const [expandido, setExpandido] = useState(new Set());
  function toggleExpandido(key) {
    setExpandido((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }
  const donutData = useMemo(() => {
    const buckets = { activas: 0, proximas: 0, finalizadas: 0, vencidas: 0 };
    records.forEach((r) => { buckets[claseEstadoOPS(r)]++; });
    return [
      { name: "Activas", value: buckets.activas, key: "activas" },
      { name: "Próximas a terminar", value: buckets.proximas, key: "proximas" },
      { name: "Finalizadas", value: buckets.finalizadas, key: "finalizadas" },
      { name: "Vencidas", value: buckets.vencidas, key: "vencidas" },
    ].filter((d) => d.value > 0);
  }, [records]);

  const evolucionData = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      if (!r.fechaInicio) return;
      const d = new Date(r.fechaInicio + "T00:00:00");
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => {
      const [y, m] = key.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
      return { mes: label, OPS: count };
    });
  }, [records]);

  const programaData = useMemo(() => {
    const map = new Map();
    records.forEach((r) => { map.set(r.programa, (map.get(r.programa) || 0) + 1); });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([programa, cantidad]) => ({ programa, cantidad }));
  }, [records]);

  const atencion = useMemo(() => {
    const vencidas = records.filter((r) => r.estado !== "Pagado" && daysDiff(r.fechaFin) < 0);
    const proximas = records.filter((r) => r.estado !== "Pagado" && daysDiff(r.fechaFin) >= 0 && daysDiff(r.fechaFin) <= 7);
    const documentos = records.filter((r) => r.tipo === "OPS" && r.estado !== "Pagado" && docsPct(r) !== null && docsPct(r) < 100);
    const pagos = records.filter((r) => r.estado === "Pendiente de pago" || r.estado === "Enviado a OPS" || r.estado === "Enviado para pago");
    return [
      { key: "vencidas", label: "OPS vencidas", dot: "🔴", tone: "brick", items: vencidas },
      { key: "proximas", label: "Próximas a terminar", dot: "🟠", tone: "amber", items: proximas },
      { key: "documentos", label: "Documentos pendientes", dot: "🟡", tone: "gold", items: documentos },
      { key: "pagos", label: "Pagos pendientes", dot: "🟢", tone: "moss", items: pagos },
    ];
  }, [records]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <Banner grande arte="academico" desde="#4B2FB8" hasta="#C026D3"
        titulo={`Hola, ${usuario || "bienvenida"}`}
        subtitulo={kpis.finalizadosPendientes > 0
          ? `Tienes ${kpis.finalizadosPendientes} cursos finalizados por gestionar y ${kpis.proximos} por terminar esta semana.`
          : "No tienes cursos finalizados pendientes. Todo al día."}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, fontSize: 13, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999, padding: "6px 13px" }}>
          <CalendarDays size={14} /> {HOY.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </Banner>

      <div className="ops-kpi-grid ops-fade-in">
        <KPI icon={FileCheck2} label="OPS activas" value={kpis.opsActivas} tone="violet" />
        <KPI icon={Clock} label="Próximas a terminar" value={kpis.proximos} tone="amber" />
        <KPI icon={AlertTriangle} label="Finalizados pendientes" value={kpis.finalizadosPendientes} tone="coral" />
        <KPI icon={FileWarning} label="Documentos pendientes" value={kpis.documentosPendientes} tone="fuchsia" />
        <KPI icon={Mail} label="Vistos buenos pendientes" value={kpis.vistosBuenos} tone="blue" />
        <KPI icon={CircleDollarSign} label="OPS pend. de pago" value={kpis.opsPendientesPago} tone="teal" />
        <KPI icon={Sparkles} label="Bonificaciones pendientes" value={kpis.bonificacionesPendientes} tone="indigo" />
        <KPI icon={CheckCircle2} label="Pagos realizados" value={kpis.pagosRealizados} tone="green" />
      </div>

      {/* ANÁLISIS */}
      <div className="ops-fade-in">
        <div className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Análisis</div>
        <div className="ops-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 14 }}>
          <div className="ops-card" style={cardStyle}>
            <div style={sectionTitle}>Estado de las OPS</div>
            {donutData.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", padding: "24px 0", textAlign: "center" }}>Sin datos suficientes todavía.</div>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={74} paddingAngle={3} cornerRadius={4} stroke="none">
                        {donutData.map((d) => <Cell key={d.key} fill={CHART_COLORS[d.key]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--line)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", top: "42%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                    <div className="font-display" style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{records.length}</div>
                    <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 2 }}>registros</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {donutData.map((d) => (
                    <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: CHART_COLORS[d.key], flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "var(--ink-soft)" }}>{d.name}</span>
                      <span style={{ fontWeight: 700 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="ops-card" style={cardStyle}>
            <div style={sectionTitle}>Evolución de OPS</div>
            {evolucionData.length < 2 ? (
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", padding: "24px 0", textAlign: "center" }}>Se necesitan registros en al menos dos meses distintos para trazar la evolución.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolucionData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--line)" }} />
                  <Line type="monotone" dataKey="OPS" stroke="var(--ink-2)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--ink-2)" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="ops-card" style={cardStyle}>
            <div style={sectionTitle}>Distribución por programa</div>
            {programaData.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", padding: "24px 0", textAlign: "center" }}>Sin datos suficientes todavía.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={programaData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="programa" width={54} tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--line)" }} />
                  <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={14}>{programaData.map((d, i) => <Cell key={d.programa} fill={["#5B45D6", "#C026D3", "#0D9488", "#F59E0B", "#2563EB", "#EF4444", "#15803D", "#EC4899"][i % 8]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* REQUIEREN ATENCIÓN */}
      <div className="ops-fade-in">
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
          <BellRing size={16} style={{ color: "var(--brand)" }} />
          <span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>Requieren atención</span>
        </div>
        {tareasHoy.length === 0 ? (
          <div style={{ ...cardStyle, fontSize: 13.5, color: "var(--ink-soft)", textAlign: "center", padding: "28px 0" }}>No hay tareas urgentes. Todo al día.</div>
        ) : (
          <div className="ops-charts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
            {atencion.map((cat) => (
              <div key={cat.key} className="ops-card" style={{ ...cardStyle, borderTop: `4px solid var(--${cat.tone})`, background: `linear-gradient(180deg, var(--${cat.tone}-soft) 0%, #fff 55%)` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: `var(--${cat.tone})`, flexShrink: 0 }} />{cat.label}</span>
                  <span className="font-display" style={{ fontSize: 18, fontWeight: 700, color: `var(--${cat.tone})` }}>{cat.items.length}</span>
                </div>
                {cat.items.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Ninguno por ahora.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ maxHeight: expandido.has(cat.key) ? 320 : "none", overflowY: expandido.has(cat.key) ? "auto" : "visible" }}>
                      {(expandido.has(cat.key) ? cat.items : cat.items.slice(0, 4)).map((r) => (
                        <button key={r.id} onClick={() => onOpen(r)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", borderTop: "1px solid var(--line)", padding: "8px 2px", textAlign: "left", cursor: "pointer", width: "100%" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.docente}</div>
                            <div style={{ fontSize: 11, color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nombrePrograma || r.programa} · {r.modulo}</div>
                          </div>
                          <ChevronRight size={13} style={{ color: "var(--ink-soft)", flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                    {cat.items.length > 4 && (
                      <button onClick={() => toggleExpandido(cat.key)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "6px 2px 0", fontSize: 11.5, fontWeight: 600, color: `var(--${cat.tone})` }}>
                        {expandido.has(cat.key) ? "Ver menos ↑" : `Ver los ${cat.items.length} completos ↓`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GESTIÓN (tabla + filtros)                                           */
/* ------------------------------------------------------------------ */
function GestionView({ filtered, search, setSearch, fTipo, setFTipo, fEstado, setFEstado, onOpen, config, onEnviarABorrador, onGenerarMasivo, pantallaCompleta, setPantallaCompleta, records, programas, tarifas, onAplicarValores }) {
  const estadosDisponibles = [...new Set([...ESTADOS.OPS, ...ESTADOS.BONIFICACION])];
  const [seleccionados, setSeleccionados] = useState(new Set());

  function toggleUno(id) {
    setSeleccionados((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleTodos() {
    setSeleccionados((s) => {
      const idsVisibles = filtered.map((r) => r.id);
      const todosMarcados = idsVisibles.length > 0 && idsVisibles.every((id) => s.has(id));
      if (todosMarcados) return new Set([...s].filter((id) => !idsVisibles.includes(id)));
      return new Set([...s, ...idsVisibles]);
    });
  }
  function enviarSeleccionados() {
    const elegidos = filtered.filter((r) => seleccionados.has(r.id));
    if (elegidos.length === 0) return;
    onEnviarABorrador(elegidos);
    setSeleccionados(new Set());
  }
  function generarMasivo() {
    const elegidos = filtered.filter((r) => seleccionados.has(r.id));
    onGenerarMasivo(elegidos);
  }

  const [panelValores, setPanelValores] = useState(false);
  const [excluidosValores, setExcluidosValores] = useState(new Set());

  // Registros cuyo valor hora no coincide con la tabla de tarifas actual.
  // Se omiten los ya pagados, los de escalafón "Otros" (valor manual) y los que
  // no tienen una tarifa exacta para su programa + categoría.
  const candidatosValores = useMemo(() => {
    const out = [];
    (records || []).forEach((r) => {
      if (r.estado === "Pagado" || r.escalafon === "Otros") return;
      const prog = (programas || []).find((p) => p.sigla === r.programa);
      if (!prog) return;
      const t = tarifaExacta(tarifas, prog.tipo, r.escalafon);
      if (!t) return;
      const nuevo = r.tipo === "OPS" ? t.valorOps : t.valorBonificacion;
      if (!nuevo || nuevo === r.valorHora) return;
      out.push({ r, nuevo });
    });
    return out;
  }, [records, programas, tarifas]);
  const aplicables = candidatosValores.filter((c) => !excluidosValores.has(c.r.id));

  function aplicarValores() {
    onAplicarValores(aplicables.map((c) => ({ id: c.r.id, valorHora: c.nuevo })));
    setExcluidosValores(new Set());
    setPanelValores(false);
  }
  function toggleExcluido(id) {
    setExcluidosValores((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const idsVisibles = filtered.map((r) => r.id);
  const todosVisiblesMarcados = idsVisibles.length > 0 && idsVisibles.every((id) => seleccionados.has(id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!pantallaCompleta && <Banner arte="contratos" desde="#2563EB" hasta="#7C3AED" titulo="OPS y Bonificaciones" subtitulo="Cada contrato y pago de tus docentes, del registro al pago." />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 600 }}>{filtered.length} registros</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {seleccionados.size > 0 && (
            <>
              <button onClick={generarMasivo} className="font-body" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <Mail size={14} /> Generar correo a la Decana ({seleccionados.size})
              </button>
              <button onClick={enviarSeleccionados} className="font-body" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--ink)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <ClipboardList size={14} /> Enviar {seleccionados.size} al Borrador de Pagos
              </button>
            </>
          )}
          <button onClick={() => setPanelValores((v) => !v)} className="font-body" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--gold-soft)", color: "var(--gold)", border: "1px solid var(--gold)", borderRadius: 9, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            <RotateCcw size={14} /> Actualizar valores{candidatosValores.length > 0 ? ` (${candidatosValores.length})` : ""}
          </button>
          <button onClick={() => setPantallaCompleta((v) => !v)} title={pantallaCompleta ? "Salir de pantalla completa" : "Ver en pantalla completa"}
            className="font-body" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--paper-raised)", border: "1px solid var(--line-strong)", borderRadius: 9, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            {pantallaCompleta ? <><Minimize2 size={14} /> Salir de pantalla completa</> : <><Maximize2 size={14} /> Pantalla completa</>}
          </button>
        </div>
      </div>

      {panelValores && (
        <div style={{ ...cardStyle, borderLeft: "3px solid var(--gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Actualizar valores según la tabla de tarifas</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3 }}>Revisa los cambios antes de aplicarlos. No se tocan los registros ya pagados ni los de escalafón "Otros" (valor manual). Desmarca los que quieras dejar como están.</div>
            </div>
            <button onClick={() => setPanelValores(false)} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 999, width: 28, height: 28, cursor: "pointer" }}><X size={14} /></button>
          </div>
          {candidatosValores.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--moss)", fontWeight: 600, padding: "6px 0" }}>Todos los valores ya coinciden con la tabla de tarifas actual.</div>
          ) : (
            <>
              <div style={{ maxHeight: 280, overflow: "auto", border: "1px solid var(--line)", borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: "var(--paper)", textAlign: "left" }}>
                      {["", "Docente", "Curso", "Valor hora", "Valor total"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {candidatosValores.map(({ r, nuevo }) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--line)", opacity: excluidosValores.has(r.id) ? 0.45 : 1 }}>
                        <td style={{ padding: "8px 10px" }}><input type="checkbox" checked={!excluidosValores.has(r.id)} onChange={() => toggleExcluido(r.id)} /></td>
                        <td style={{ padding: "8px 10px", fontWeight: 600 }}>{r.docente}<div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 400 }}>{r.tipo === "OPS" ? "OPS" : "Bonificación"} · {r.estado}</div></td>
                        <td style={{ padding: "8px 10px", color: "var(--ink-soft)" }}>{r.modulo}</td>
                        <td className="font-mono" style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{COP(r.valorHora)} → <b style={{ color: "var(--moss)" }}>{COP(nuevo)}</b></td>
                        <td className="font-mono" style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{COP(r.horas * r.valorHora)} → <b style={{ color: "var(--moss)" }}>{COP(r.horas * nuevo)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={aplicarValores} disabled={aplicables.length === 0} style={{ background: "var(--moss)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: aplicables.length === 0 ? "not-allowed" : "pointer", opacity: aplicables.length === 0 ? 0.5 : 1 }}>
                  Aplicar {aplicables.length} cambio{aplicables.length === 1 ? "" : "s"}
                </button>
                <button onClick={() => setPanelValores(false)} style={{ background: "var(--paper-raised)", border: "1px solid var(--line-strong)", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: 10, color: "var(--ink-soft)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por docente, programa, curso, No. OPS..."
            className="font-body" style={{ width: "100%", padding: "9px 12px 9px 32px", borderRadius: 9, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", fontSize: 13 }} />
        </div>
        <MultiSelect label="Tipo" options={[{ value: "OPS", label: "OPS" }, { value: "BONIFICACION", label: "Bonificación" }]} selected={fTipo} onChange={setFTipo} />
        <MultiSelect label="Estado" options={estadosDisponibles} selected={fEstado} onChange={setFEstado} />
      </div>

      <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--paper)", textAlign: "left", position: "sticky", top: 0, zIndex: 1 }}>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", width: 32 }}>
                <input type="checkbox" checked={todosVisiblesMarcados} onChange={toggleTodos} title="Seleccionar todos" />
              </th>
              {["Tipo", "Docente", "Programa", "Cohorte", "Curso / Módulo", "Inicio", "Fin", "Estado", "Valor", "Docs"].map((h) => (
                <th key={h} className="font-body" style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const u = urgencia(r);
              const pct = docsPct(r);
              const pagado = r.estado === "Pagado";
              const enviadoPago = r.estado === "Enviado para pago" || r.estado === "Pendiente de pago";
              const marcado = seleccionados.has(r.id);
              const fondoBase = marcado ? "var(--gold-soft)" : pagado ? "var(--moss-soft)" : enviadoPago ? "#FFE3C2" : "transparent";
              const fondoHover = pagado ? "#D8F0E4" : enviadoPago ? "#FFD6A5" : "var(--paper)";
              return (
                <tr key={r.id} style={{ cursor: "pointer", borderBottom: "1px solid var(--line)", background: fondoBase }}
                  onMouseEnter={(e) => { if (!marcado) e.currentTarget.style.background = fondoHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = fondoBase; }}>
                  <td style={{ padding: "10px 12px" }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={marcado} onChange={() => toggleUno(r.id)} />
                  </td>
                  <td style={tdStyle} onClick={() => onOpen(r)}><Pill tone={r.tipo === "OPS" ? "neutral" : "gold"}>{r.tipo === "OPS" ? r.noOPS || "OPS" : "Bonif."}</Pill></td>
                  <td style={{ ...tdStyle, fontWeight: 600, minWidth: 150 }} onClick={() => onOpen(r)}>{r.docente}</td>
                  <td style={tdStyle} onClick={() => onOpen(r)}>{r.programa}{r.nombrePrograma && <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 500 }}>{r.nombrePrograma}</div>}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }} onClick={() => onOpen(r)}>{r.cohorte || "—"}</td>
                  <td style={{ ...tdStyle, color: "var(--ink-soft)", minWidth: 210 }} onClick={() => onOpen(r)}>{r.modulo}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }} onClick={() => onOpen(r)}>{fmtDate(r.fechaInicio)}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }} onClick={() => onOpen(r)}>{fmtDate(r.fechaFin)}<div><Pill tone={UrgTone(u.level)}>{u.label}</Pill></div></td>
                  <td style={{ ...tdStyle, fontWeight: pagado || enviadoPago ? 700 : 400, color: pagado ? "var(--moss)" : enviadoPago ? "#C2610A" : "var(--ink)" }} onClick={() => onOpen(r)}>{pagado && <CheckCircle2 size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />}{r.estado}</td>
                  <td className="font-mono" style={{ ...tdStyle, whiteSpace: "nowrap" }} onClick={() => onOpen(r)}>{COP(valorTotal(r))}</td>
                  <td style={tdStyle} onClick={() => onOpen(r)}>{pct == null ? "—" : <span style={{ color: pct === 100 ? "var(--moss)" : "var(--amber)", fontWeight: 600 }}>{pct}%</span>}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={11} style={{ padding: 24, textAlign: "center", color: "var(--ink-soft)", fontSize: 13 }}>No hay registros con estos filtros.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PROGRAMAS                                                           */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  BORRADOR DE PAGOS (tabla independiente, tipo hoja de cálculo)      */
/* ------------------------------------------------------------------ */
function estadoEnvio(fechaEnvioOps) {
  const d = daysDiff(fechaEnvioOps);
  if (d < 0) return { nivel: "red", texto: `Venció hace ${Math.abs(d)} día${Math.abs(d) === 1 ? "" : "s"}`, dot: "🔴" };
  if (d === 0) return { nivel: "red", texto: "Enviar hoy", dot: "🔴" };
  if (d <= 7) return { nivel: "yellow", texto: `Enviar en ${d} día${d === 1 ? "" : "s"}`, dot: "🟡" };
  return { nivel: "green", texto: `Faltan ${d} días`, dot: "🟢" };
}
const cellInput = { border: "1px solid transparent", background: "transparent", borderRadius: 6, padding: "6px 8px", fontSize: 13, fontFamily: "inherit", width: "100%" };
const cellInputFocus = (e) => { e.target.style.border = "1px solid var(--line-strong)"; e.target.style.background = "var(--paper-raised)"; };
const cellInputBlur = (e) => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; };

function BorradorPagosView({ items, onAdd, onUpdate, onDelete }) {
  const [search, setSearch] = useState("");
  const [fTipo, setFTipo] = useState([]);
  const [ordenPor, setOrdenPor] = useState(null); // "fechaFin" | "fechaEnvioOps" | null
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [confirmandoId, setConfirmandoId] = useState(null);

  const filtrados = useMemo(() => {
    let out = items.filter((b) => {
      if (fTipo.length && !fTipo.includes(b.tipo)) return false;
      const s = search.trim().toLowerCase();
      if (!s) return true;
      return (b.docente || "").toLowerCase().includes(s);
    });
    if (ordenPor) {
      out = [...out].sort((a, b) => {
        const da = a[ordenPor] || "";
        const db = b[ordenPor] || "";
        return ordenAsc ? da.localeCompare(db) : db.localeCompare(da);
      });
    }
    return out;
  }, [items, search, fTipo, ordenPor, ordenAsc]);

  const kpis = useMemo(() => ({
    ops: items.filter((b) => b.tipo === "OPS").length,
    bonif: items.filter((b) => b.tipo === "BONIFICACION").length,
    total: items.reduce((acc, b) => acc + (Number(b.valor) || 0), 0),
  }), [items]);

  function toggleOrden(campo) {
    if (ordenPor === campo) setOrdenAsc((a) => !a);
    else { setOrdenPor(campo); setOrdenAsc(true); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Banner arte="pagos" desde="#0D9488" hasta="#2563EB" titulo="Borrador de pagos" subtitulo="Planificación rápida de OPS y bonificaciones pendientes de gestionar." />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <button onClick={onAdd} className="font-body" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 11, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={15} /> Agregar registro
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KPI icon={FileCheck2} label="OPS pendientes" value={kpis.ops} tone="ink" />
        <KPI icon={Sparkles} label="Bonificaciones pendientes" value={kpis.bonif} tone="gold" />
        <KPI icon={CircleDollarSign} label="Total pendiente" value={COP(kpis.total)} tone="moss" />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: 10, color: "var(--ink-soft)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por docente..."
            className="font-body" style={{ width: "100%", padding: "9px 12px 9px 32px", borderRadius: 9, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", fontSize: 13 }} />
        </div>
        <MultiSelect label="Tipo" options={[{ value: "OPS", label: "OPS" }, { value: "BONIFICACION", label: "Bonificación" }]} selected={fTipo} onChange={setFTipo} />
      </div>

      <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--paper)", textAlign: "left" }}>
              <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)" }}>Tipo</th>
              <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)" }}>Docente</th>
              <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)", textAlign: "right" }}>Valor</th>
              <th onClick={() => toggleOrden("fechaFin")} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)", cursor: "pointer", whiteSpace: "nowrap" }}>
                Fecha finalización <ArrowUpDown size={11} style={{ verticalAlign: -1, opacity: ordenPor === "fechaFin" ? 1 : 0.4 }} />
              </th>
              <th onClick={() => toggleOrden("fechaEnvioOps")} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)", cursor: "pointer", whiteSpace: "nowrap" }}>
                Fecha de envío a OPS <ArrowUpDown size={11} style={{ verticalAlign: -1, opacity: ordenPor === "fechaEnvioOps" ? 1 : 0.4 }} />
              </th>
              <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((b) => {
              const est = estadoEnvio(b.fechaEnvioOps);
              return (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "6px 10px" }}>
                    <select value={b.tipo} onChange={(e) => onUpdate(b.id, "tipo", e.target.value)} style={{ ...cellInput, fontWeight: 600 }} onFocus={cellInputFocus} onBlur={cellInputBlur}>
                      <option value="OPS">OPS</option>
                      <option value="BONIFICACION">Bonificación</option>
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <input value={b.docente} onChange={(e) => onUpdate(b.id, "docente", e.target.value)} placeholder="Nombre del docente" style={{ ...cellInput, fontWeight: 600 }} onFocus={cellInputFocus} onBlur={cellInputBlur} />
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <input type="number" value={b.valor} onChange={(e) => onUpdate(b.id, "valor", Number(e.target.value) || 0)} className="font-mono" style={{ ...cellInput, textAlign: "right" }} onFocus={cellInputFocus} onBlur={cellInputBlur} />
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <input type="date" value={b.fechaFin} onChange={(e) => onUpdate(b.id, "fechaFin", e.target.value)} style={cellInput} onFocus={cellInputFocus} onBlur={cellInputBlur} />
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <input type="date" value={b.fechaEnvioOps} onChange={(e) => onUpdate(b.id, "fechaEnvioOps", e.target.value)} style={cellInput} onFocus={cellInputFocus} onBlur={cellInputBlur} />
                      <span style={{ fontSize: 10.5, paddingLeft: 8, color: est.nivel === "red" ? "var(--brick)" : est.nivel === "yellow" ? "var(--amber)" : "var(--moss)" }}>{est.dot} {est.texto}</span>
                    </div>
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    {confirmandoId === b.id ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center", whiteSpace: "nowrap" }}>
                        <button onClick={() => { onDelete(b.id); setConfirmandoId(null); }} style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--brick)", border: "none", borderRadius: 5, padding: "4px 7px", cursor: "pointer" }}>Sí, borrar</button>
                        <button onClick={() => setConfirmandoId(null)} style={{ fontSize: 11, fontWeight: 600, background: "none", border: "1px solid var(--line-strong)", borderRadius: 5, padding: "4px 7px", cursor: "pointer" }}>No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmandoId(b.id)} style={{ background: "none", border: "none", cursor: "pointer" }} title="Eliminar">
                        <Trash2 size={14} style={{ color: "var(--brick)" }} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: "var(--ink-soft)", fontSize: 13 }}>
                {items.length === 0 ? "Todavía no hay registros. Usa \"Agregar registro\" para empezar." : "No hay registros con estos filtros."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ProgramasView({ programas, setProgramas, tarifas, notify }) {
  const [nuevo, setNuevo] = useState({ sigla: "", nombre: "", tipo: NIVELES_ACADEMICOS[0], pa: "", cc: "", coordinador: "", correo: "" });
  const [confirmandoSigla, setConfirmandoSigla] = useState(null);

  function actualizar(sigla, campo, valor) {
    setProgramas((ps) => ps.map((p) => p.sigla === sigla ? { ...p, [campo]: valor } : p));
  }
  function eliminar(sigla) {
    setProgramas((ps) => ps.filter((p) => p.sigla !== sigla));
    setConfirmandoSigla(null);
    notify("Programa eliminado del catálogo");
  }
  function agregar() {
    const sigla = nuevo.sigla.trim().toUpperCase();
    if (!sigla || !nuevo.nombre.trim()) { notify("Sigla y nombre son obligatorios"); return; }
    if (programas.some((p) => p.sigla === sigla)) { notify("Ya existe un programa con esa sigla"); return; }
    setProgramas((ps) => [...ps, { sigla, nombre: nuevo.nombre.trim(), tipo: nuevo.tipo || NIVELES_ACADEMICOS[0], pa: nuevo.pa.trim(), cc: nuevo.cc.trim(), coordinador: nuevo.coordinador.trim(), correo: nuevo.correo.trim() }]);
    setNuevo({ sigla: "", nombre: "", tipo: NIVELES_ACADEMICOS[0], pa: "", cc: "", coordinador: "", correo: "" });
    notify("Programa agregado al catálogo");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Banner arte="programas" desde="#4338CA" hasta="#0EA5E9" titulo="Catálogo de programas" subtitulo="Edita cualquier celda directamente. Al elegir un programa en un registro, estos datos se autocompletan." />

      <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
        <div style={{ padding: "14px 16px 4px" }}>
          <div style={sectionTitle}>Coordinadores por programa</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
          <thead>
            <tr style={{ background: "var(--paper)", textAlign: "left" }}>
              {["Programa", "Coordinador", "Correo coordinador"].map((h) => (
                <th key={h} style={{ padding: "9px 10px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {programas.map((p) => (
              <tr key={p.sigla} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 700 }}>{p.sigla}</span>
                  <span style={{ color: "var(--ink-soft)", marginLeft: 6, fontSize: 12 }}>{p.nombre}</span>
                </td>
                <td style={tdStyle}><input defaultValue={p.coordinador} onBlur={(e) => actualizar(p.sigla, "coordinador", e.target.value)} style={{ ...inputStyle, minWidth: 200 }} /></td>
                <td style={tdStyle}><input defaultValue={p.correo} onBlur={(e) => actualizar(p.sigla, "correo", e.target.value)} style={{ ...inputStyle, minWidth: 220 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
        <div style={{ padding: "14px 16px 4px" }}>
          <div style={sectionTitle}>Catálogo completo</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
          <thead>
            <tr style={{ background: "var(--paper)", textAlign: "left" }}>
              {["Sigla", "Nombre del programa", "Tipo", "PA", "Centro de costos", "Coordinador", "Correo coordinador", ""].map((h) => (
                <th key={h} style={{ padding: "9px 10px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {programas.map((p) => (
              <tr key={p.sigla} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: "nowrap" }}>{p.sigla}</td>
                <td style={tdStyle}><input defaultValue={p.nombre} onBlur={(e) => actualizar(p.sigla, "nombre", e.target.value)} style={{ ...inputStyle, minWidth: 220 }} /></td>
                <td style={tdStyle}>
                  <select defaultValue={p.tipo} onBlur={(e) => actualizar(p.sigla, "tipo", e.target.value)} onChange={(e) => actualizar(p.sigla, "tipo", e.target.value)} style={{ ...inputStyle, width: 150 }}>
                    {NIVELES_ACADEMICOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={tdStyle}><input defaultValue={p.pa} onBlur={(e) => actualizar(p.sigla, "pa", e.target.value)} style={{ ...inputStyle, width: 80 }} /></td>
                <td style={tdStyle}><input defaultValue={p.cc} onBlur={(e) => actualizar(p.sigla, "cc", e.target.value)} style={{ ...inputStyle, width: 110 }} /></td>
                <td style={tdStyle}><input defaultValue={p.coordinador} onBlur={(e) => actualizar(p.sigla, "coordinador", e.target.value)} style={{ ...inputStyle, minWidth: 190 }} /></td>
                <td style={tdStyle}><input defaultValue={p.correo} onBlur={(e) => actualizar(p.sigla, "correo", e.target.value)} style={{ ...inputStyle, minWidth: 190 }} /></td>
                <td style={tdStyle}>
                  {confirmandoSigla === p.sigla ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center", whiteSpace: "nowrap" }}>
                      <button onClick={() => eliminar(p.sigla)} style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--brick)", border: "none", borderRadius: 5, padding: "4px 7px", cursor: "pointer" }}>Sí, borrar</button>
                      <button onClick={() => setConfirmandoSigla(null)} style={{ fontSize: 11, fontWeight: 600, background: "none", border: "1px solid var(--line-strong)", borderRadius: 5, padding: "4px 7px", cursor: "pointer" }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmandoSigla(p.sigla)} style={{ background: "none", border: "none", cursor: "pointer" }} title="Eliminar programa">
                      <Trash2 size={14} style={{ color: "var(--brick)" }} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td style={tdStyle}><input placeholder="SIGLA" value={nuevo.sigla} onChange={(e) => setNuevo({ ...nuevo, sigla: e.target.value })} style={{ ...inputStyle, width: 90 }} /></td>
              <td style={tdStyle}><input placeholder="Nombre del programa" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} style={{ ...inputStyle, minWidth: 220 }} /></td>
              <td style={tdStyle}>
                <select value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })} style={{ ...inputStyle, width: 150 }}>
                  {NIVELES_ACADEMICOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </td>
              <td style={tdStyle}><input placeholder="PA" value={nuevo.pa} onChange={(e) => setNuevo({ ...nuevo, pa: e.target.value })} style={{ ...inputStyle, width: 80 }} /></td>
              <td style={tdStyle}><input placeholder="C. costos" value={nuevo.cc} onChange={(e) => setNuevo({ ...nuevo, cc: e.target.value })} style={{ ...inputStyle, width: 110 }} /></td>
              <td style={tdStyle}><input placeholder="Coordinador" value={nuevo.coordinador} onChange={(e) => setNuevo({ ...nuevo, coordinador: e.target.value })} style={{ ...inputStyle, minWidth: 190 }} /></td>
              <td style={tdStyle}><input placeholder="correo@usbcali.edu.co" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} style={{ ...inputStyle, minWidth: 190 }} /></td>
              <td style={tdStyle}>
                <button onClick={agregar} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--moss)", color: "#fff", border: "none", borderRadius: 7, padding: "7px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Plus size={13} /> Agregar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CONFIGURACIÓN / ADMINISTRACIÓN                                      */
/* ------------------------------------------------------------------ */
function ConfiguracionView({ config, setConfig, tarifas, setTarifas, programas, onReset, onVaciar, notify, diag, recordsCount, onVerificar }) {
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);
  const [borrador, setBorrador] = useState(config);
  const [nuevoDoc, setNuevoDoc] = useState("");
  const [nuevaTarifa, setNuevaTarifa] = useState({ tipoPrograma: NIVELES_ACADEMICOS[0], categoria: CATEGORIAS_ESCALAFON[0], valorOps: "", valorBonificacion: "" });
  const [confirmandoTarifaId, setConfirmandoTarifaId] = useState(null);

  const num = (k) => ({
    value: String(borrador[k]),
    onChange: (e) => setBorrador({ ...borrador, [k]: Number(e.target.value) || 0 }),
  });

  function guardarTarifa(id, campo, valor) {
    setTarifas((ts) => ts.map((t) => t.id === id ? { ...t, [campo]: valor } : t));
  }

  function agregarTarifa() {
    if (!nuevaTarifa.tipoPrograma || !nuevaTarifa.categoria) return;
    if (tarifas.some((t) => t.tipoPrograma === nuevaTarifa.tipoPrograma && t.categoria === nuevaTarifa.categoria)) { notify("Esa combinación de tipo de programa y categoría ya existe"); return; }
    setTarifas((ts) => [...ts, {
      id: `t-${Date.now()}`,
      tipoPrograma: nuevaTarifa.tipoPrograma,
      categoria: nuevaTarifa.categoria,
      valorOps: Number(nuevaTarifa.valorOps) || 0,
      valorBonificacion: Number(nuevaTarifa.valorBonificacion) || 0,
    }]);
    setNuevaTarifa({ tipoPrograma: NIVELES_ACADEMICOS[0], categoria: CATEGORIAS_ESCALAFON[0], valorOps: "", valorBonificacion: "" });
    notify("Tarifa agregada a la tabla");
  }

  function eliminarTarifa(id) {
    if (tarifas.length <= 1) return;
    setTarifas((ts) => ts.filter((t) => t.id !== id));
    setConfirmandoTarifaId(null);
    notify("Tarifa eliminada de la tabla");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Banner arte="ajustes" desde="#334155" hasta="#7C3AED" titulo="Administración" subtitulo="Parámetros de cálculo, documentos, alertas, tarifas y plantillas de correo." />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => { setConfig(borrador); notify("Configuración guardada"); }} style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: 11, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Guardar cambios
        </button>
      </div>

      <div className="ops-cfg-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14 }}>
        <section style={{ ...cardStyle, gridColumn: "1 / -1" }}>
          <div style={sectionTitle}>Cálculos de seguridad social</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))", gap: 10 }}>
            <Labeled label="Clase de riesgo ARL">
              <select style={inputStyle} value={ARL_CLASES.includes(borrador.arlClase) ? borrador.arlClase : "I"} onChange={(e) => setBorrador({ ...borrador, arlClase: e.target.value })}>
                {ARL_CLASES.map((c) => <option key={c} value={c}>Clase {c}</option>)}
              </select>
            </Labeled>
            <Labeled label="% Otros"><input type="number" step="0.01" style={inputStyle} {...num("otrosPct")} /></Labeled>
            <Labeled label="Días estimados de pago"><input type="number" style={inputStyle} {...num("diasEstimadosPago")} /></Labeled>
            <Labeled label="Tarifas vigentes desde (auditor)"><input type="date" style={inputStyle} value={borrador.tarifasVigentesDesde || ""} onChange={(e) => setBorrador({ ...borrador, tarifasVigentesDesde: e.target.value })} /></Labeled>
            <Labeled label="Aproximar aportes a $100 (PILA)">
              <select style={inputStyle} value={borrador.redondeoPILA ? "si" : "no"} onChange={(e) => setBorrador({ ...borrador, redondeoPILA: e.target.value === "si" })}>
                <option value="si">Sí, al múltiplo superior</option>
                <option value="no">No, al peso</option>
              </select>
            </Labeled>
          </div>
          <div style={{ marginTop: 16, fontSize: 12.5, fontWeight: 700 }}>Norma por año</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 12, marginTop: 8 }}>
            {Object.keys(borrador.normaSS || {}).sort().map((anio) => {
              const n = borrador.normaSS[anio];
              const setN = (patch) => setBorrador({ ...borrador, normaSS: { ...borrador.normaSS, [anio]: { ...n, ...patch } } });
              const campo = (etiqueta, k, step = "0.01") => (
                <Labeled label={etiqueta}><input type="number" step={step} style={inputStyle} value={String(n[k])} onChange={(e) => setN({ [k]: Number(e.target.value) || 0 })} /></Labeled>
              );
              return (
                <div key={anio} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 14, background: "var(--paper)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>{anio}</span>
                    {Object.keys(borrador.normaSS).length > 1 && (
                      <button title="Quitar año" onClick={() => { const { [anio]: _, ...resto } = borrador.normaSS; setBorrador({ ...borrador, normaSS: resto }); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={14} style={{ color: "var(--brick)" }} /></button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ gridColumn: "1 / -1" }}>{campo("Salario mínimo (SMMLV)", "smmlv", "1")}</div>
                    {campo("% IBC sobre ingresos", "ibcPct")}
                    {campo("Tope del IBC (en SMMLV)", "topeSmmlv")}
                    {campo("% Salud", "saludPct")}
                    {campo("% Pensión", "pensionPct")}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>% ARL por clase de riesgo</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 4 }}>
                    {ARL_CLASES.map((c) => (
                      <Labeled key={c} label={`Clase ${c}`}><input type="number" step="0.001" style={inputStyle} value={String((n.arl || {})[c] ?? 0)} onChange={(e) => setN({ arl: { ...(n.arl || {}), [c]: Number(e.target.value) || 0 } })} /></Labeled>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => {
            const anios = Object.keys(borrador.normaSS || {}).map(Number);
            const sig = String((anios.length ? Math.max(...anios) : new Date().getFullYear() - 1) + 1);
            const base = borrador.normaSS?.[String(sig - 1)] || Object.values(borrador.normaSS || {}).pop() || CONFIG_DEFAULT.normaSS["2026"];
            setBorrador({ ...borrador, normaSS: { ...borrador.normaSS, [sig]: { ...base, arl: { ...base.arl } } } });
          }} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, background: "var(--paper-raised)", border: "1px solid var(--line-strong)", borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={13} /> Agregar año (copia el anterior)
          </button>
          <p style={{ marginTop: 10, fontSize: 11.5, color: "var(--ink-soft)" }}>
            IBC = mayor entre el % de los ingresos del mes y 1 SMMLV, con tope de {`"Tope SMMLV"`}. Salud, pensión y ARL se calculan sobre el IBC definitivo. Los porcentajes van en unidades (40 = 40 %). El valor total del módulo se paga y cotiza en el mes en que finaliza (mes completo). Las bonificaciones no calculan IBC ni seguridad social. Verifique los valores vigentes con Contabilidad/Nómina.
          </p>
        </section>

        <section style={cardStyle}>
          <div style={sectionTitle}>Alertas y usuario responsable</div>
          <Labeled label="Días de anticipación para alertas">
            <input style={inputStyle} value={borrador.diasAlerta.join(", ")} onChange={(e) => setBorrador({ ...borrador, diasAlerta: e.target.value.split(",").map((v) => Number(v.trim())).filter((v) => !Number.isNaN(v)) })} />
          </Labeled>
          <p style={{ marginTop: 4, fontSize: 11.5, color: "var(--ink-soft)" }}>Ejemplo: 7, 3, 1 genera avisos siete, tres y un día antes de finalizar el curso.</p>
          <div style={{ marginTop: 12 }}>
            <Labeled label="Usuario que actualiza los registros">
              <input style={inputStyle} value={borrador.usuarioActual} onChange={(e) => setBorrador({ ...borrador, usuarioActual: e.target.value })} />
            </Labeled>
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Labeled label="Nombre de la Decana/Decano">
              <input style={inputStyle} value={borrador.decanaNombre} onChange={(e) => setBorrador({ ...borrador, decanaNombre: e.target.value })} />
            </Labeled>
            <Labeled label="Correo de la Decana/Decano">
              <input style={inputStyle} value={borrador.decanaCorreo} onChange={(e) => setBorrador({ ...borrador, decanaCorreo: e.target.value })} />
            </Labeled>
          </div>
          <p style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-soft)" }}>Se usan en el botón "Enviar a la Decana para aprobación y nómina" dentro de cada registro.</p>
          <div style={{ marginTop: 12, background: "var(--paper)", borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Estados configurados</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
              {ESTADOS.OPS.map((e) => <Pill key={e}>{e}</Pill>)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ESTADOS.BONIFICACION.map((e) => <Pill key={e} tone="gold">{e}</Pill>)}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={sectionTitle}>Documentos requeridos para OPS</div>
          <ul style={{ display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
            {borrador.documentosRequeridos.map((d) => (
              <li key={d} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 8, padding: "7px 10px", fontSize: 13 }}>
                <span style={{ flex: 1 }}>{d}</span>
                <button onClick={() => setBorrador({ ...borrador, documentosRequeridos: borrador.documentosRequeridos.filter((x) => x !== d) })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Trash2 size={14} style={{ color: "var(--brick)" }} />
                </button>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input style={inputStyle} placeholder="Nuevo documento" value={nuevoDoc} onChange={(e) => setNuevoDoc(e.target.value)} />
            <button onClick={() => { const v = nuevoDoc.trim(); if (!v) return; setBorrador({ ...borrador, documentosRequeridos: [...borrador.documentosRequeridos, v] }); setNuevoDoc(""); }}
              style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", border: "1px solid var(--line-strong)", background: "var(--paper-raised)", borderRadius: 8, padding: "0 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Agregar
            </button>
          </div>
          <p style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-soft)" }}>Las bonificaciones no requieren documentos; esta lista solo aplica a registros de tipo OPS.</p>
        </section>

        <section style={cardStyle}>
          <div style={sectionTitle}>Plantilla de correo de visto bueno (coordinador)</div>
          <Labeled label="Asunto"><input style={inputStyle} value={borrador.plantillaAsunto} onChange={(e) => setBorrador({ ...borrador, plantillaAsunto: e.target.value })} /></Labeled>
          <div style={{ marginTop: 10 }}>
            <Labeled label="Cuerpo"><textarea rows={9} style={{ ...inputStyle, resize: "vertical" }} value={borrador.plantillaCuerpo} onChange={(e) => setBorrador({ ...borrador, plantillaCuerpo: e.target.value })} /></Labeled>
          </div>
          <p style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-soft)" }}>
            Variables: {"{coordinador} {docente} {programa} {modulo} {cohorte} {horas} {valor} {fechaInicio} {fechaFin} {noOps} {usuario}"}
          </p>
        </section>

        <section style={cardStyle}>
          <div style={sectionTitle}>Plantilla de correo para la Decana</div>
          <Labeled label="Asunto"><input style={inputStyle} value={borrador.plantillaDecanaAsunto} onChange={(e) => setBorrador({ ...borrador, plantillaDecanaAsunto: e.target.value })} /></Labeled>
          <div style={{ marginTop: 10 }}>
            <Labeled label="Cuerpo"><textarea rows={9} style={{ ...inputStyle, resize: "vertical" }} value={borrador.plantillaDecanaCuerpo} onChange={(e) => setBorrador({ ...borrador, plantillaDecanaCuerpo: e.target.value })} /></Labeled>
          </div>
          <p style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-soft)" }}>
            Variables: {"{decana} {docente} {programa} {modulo} {cohorte} {horas} {valor} {fechaInicio} {fechaFin} {tipoVinculacion} {noOps} {usuario}"}
          </p>
          <p style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-soft)" }}>El nombre y correo de la Decana se editan arriba, en "Alertas y usuario responsable".</p>
        </section>

        <section style={cardStyle}>
          <div style={sectionTitle}>Plantilla de correo: formato de bonificación (docente)</div>
          <Labeled label="Asunto"><input style={inputStyle} value={borrador.plantillaBonifAsunto} onChange={(e) => setBorrador({ ...borrador, plantillaBonifAsunto: e.target.value })} /></Labeled>
          <div style={{ marginTop: 10 }}>
            <Labeled label="Cuerpo"><textarea rows={9} style={{ ...inputStyle, resize: "vertical" }} value={borrador.plantillaBonifCuerpo} onChange={(e) => setBorrador({ ...borrador, plantillaBonifCuerpo: e.target.value })} /></Labeled>
          </div>
          <p style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-soft)" }}>
            Variables: {"{docente} {programa} {modulo} {cohorte} {horas} {valor} {fechaInicio} {fechaFin} {usuario}"}
          </p>
          <p style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-soft)" }}>Se envía al correo del propio docente, desde el botón "Pedir al docente diligenciar formato de bonificación" en cada registro de tipo Bonificación.</p>
        </section>

        <section style={cardStyle}>
          <div style={sectionTitle}>Plantilla de correo: documentos pendientes (docente)</div>
          <Labeled label="Asunto"><input style={inputStyle} value={borrador.plantillaPendientesAsunto} onChange={(e) => setBorrador({ ...borrador, plantillaPendientesAsunto: e.target.value })} /></Labeled>
          <div style={{ marginTop: 10 }}>
            <Labeled label="Cuerpo"><textarea rows={9} style={{ ...inputStyle, resize: "vertical" }} value={borrador.plantillaPendientesCuerpo} onChange={(e) => setBorrador({ ...borrador, plantillaPendientesCuerpo: e.target.value })} /></Labeled>
          </div>
          <p style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-soft)" }}>
            Variables: {"{docente} {programa} {modulo} {noOps} {pendientes} {observaciones} {usuario}"}
          </p>
          <p style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-soft)" }}>{"{pendientes}"} se reemplaza por la lista de documentos que faltan y {"{observaciones}"} por las alertas de la revisión (queda vacío si no hay).</p>
        </section>
      </div>

      <section style={{ ...cardStyle, overflowX: "auto" }}>
        <div style={sectionTitle}>Tarifas por tipo de programa y escalafón ({tarifas.length})</div>
        <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: -6, marginBottom: 10 }}>El valor hora se calcula automáticamente cruzando el tipo de programa (columna del catálogo de Programas) con el escalafón/categoría del docente, y según si el registro es OPS o Bonificación.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 680 }}>
          <thead>
            <tr style={{ background: "var(--paper)", textAlign: "left" }}>
              {["Tipo Programa", "Categoría", "Valor hora OPS", "Valor hora bonificación", ""].map((h) => (
                <th key={h} style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", borderBottom: "1px solid var(--line)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tarifas.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{t.tipoPrograma}</td>
                <td style={tdStyle}>{t.categoria}</td>
                <td style={tdStyle}>
                  <input type="number" defaultValue={t.valorOps} onBlur={(e) => guardarTarifa(t.id, "valorOps", Number(e.target.value) || 0)} style={{ ...inputStyle, width: 130 }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" defaultValue={t.valorBonificacion} onBlur={(e) => guardarTarifa(t.id, "valorBonificacion", Number(e.target.value) || 0)} style={{ ...inputStyle, width: 130 }} />
                </td>
                <td style={tdStyle}>
                  {confirmandoTarifaId === t.id ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center", whiteSpace: "nowrap" }}>
                      <button onClick={() => eliminarTarifa(t.id)} style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--brick)", border: "none", borderRadius: 5, padding: "4px 7px", cursor: "pointer" }}>Sí, borrar</button>
                      <button onClick={() => setConfirmandoTarifaId(null)} style={{ fontSize: 11, fontWeight: 600, background: "none", border: "1px solid var(--line-strong)", borderRadius: 5, padding: "4px 7px", cursor: "pointer" }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmandoTarifaId(t.id)} disabled={tarifas.length <= 1} title={tarifas.length <= 1 ? "Debe quedar al menos una tarifa" : "Eliminar"} style={{ background: "none", border: "none", cursor: tarifas.length <= 1 ? "not-allowed" : "pointer", opacity: tarifas.length <= 1 ? 0.35 : 1 }}>
                      <Trash2 size={14} style={{ color: "var(--brick)" }} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td style={tdStyle}>
                <select value={nuevaTarifa.tipoPrograma} onChange={(e) => setNuevaTarifa({ ...nuevaTarifa, tipoPrograma: e.target.value })} style={inputStyle}>
                  {NIVELES_ACADEMICOS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </td>
              <td style={tdStyle}>
                <select value={nuevaTarifa.categoria} onChange={(e) => setNuevaTarifa({ ...nuevaTarifa, categoria: e.target.value })} style={inputStyle}>
                  {CATEGORIAS_ESCALAFON.filter((c) => c !== "Otros").map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </td>
              <td style={tdStyle}><input type="number" placeholder="Valor OPS" value={nuevaTarifa.valorOps} onChange={(e) => setNuevaTarifa({ ...nuevaTarifa, valorOps: e.target.value })} style={{ ...inputStyle, width: 130 }} /></td>
              <td style={tdStyle}><input type="number" placeholder="Valor Bonif." value={nuevaTarifa.valorBonificacion} onChange={(e) => setNuevaTarifa({ ...nuevaTarifa, valorBonificacion: e.target.value })} style={{ ...inputStyle, width: 130 }} /></td>
              <td style={tdStyle}>
                <button onClick={agregarTarifa} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--moss)", color: "#fff", border: "none", borderRadius: 7, padding: "7px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Plus size={13} /> Agregar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Datos de prueba</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Esta información se guarda automáticamente en tu navegador y sigue disponible la próxima vez que abras esta aplicación. Al conectar una base de datos real y el correo (API/SMTP) esta pantalla mantendrá los mismos parámetros.</div>
        </div>
        <button onClick={onReset} style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          <RotateCcw size={14} /> Restaurar datos de ejemplo
        </button>
      </section>

      <section style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Empezar desde cero</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Elimina todos los registros de OPS y bonificaciones ({recordsCount}) para cargar tu información real. No toca programas, tarifas ni configuración.</div>
        </div>
        {!confirmarVaciar ? (
          <button onClick={() => setConfirmarVaciar(true)} disabled={recordsCount === 0} style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid var(--brick)", background: "var(--paper-raised)", color: "var(--brick)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: recordsCount === 0 ? "not-allowed" : "pointer", opacity: recordsCount === 0 ? 0.5 : 1 }}>
            <Trash2 size={14} /> Eliminar todos los registros
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--brick)" }}>¿Eliminar los {recordsCount} registros? No se puede deshacer.</span>
            <button onClick={() => { onVaciar(); setConfirmarVaciar(false); }} style={{ background: "var(--brick)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Sí, eliminar todo</button>
            <button onClick={() => setConfirmarVaciar(false)} style={{ border: "1px solid var(--line-strong)", background: "var(--paper-raised)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          </div>
        )}
      </section>

      {diag && (
        <section style={cardStyle}>
          <div style={sectionTitle}>Diagnóstico de guardado (temporal)</div>
          <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: -6, marginBottom: 10 }}>Esto ayuda a confirmar si React y el almacenamiento están sincronizados. Si alguna vez un registro "desaparece" de la interfaz, usa "Verificar consistencia ahora" antes de volver a crearlo.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, fontSize: 12.5 }}>
            <div style={{ background: "var(--paper)", borderRadius: 8, padding: 10 }}>
              <div style={{ color: "var(--ink-soft)", fontSize: 11 }}>Registros mostrados en React</div>
              <div className="font-mono" style={{ fontWeight: 700, fontSize: 16 }}>{recordsCount}</div>
            </div>
            <div style={{ background: "var(--paper)", borderRadius: 8, padding: 10 }}>
              <div style={{ color: "var(--ink-soft)", fontSize: 11 }}>Registros en almacenamiento (última verificación)</div>
              <div className="font-mono" style={{ fontWeight: 700, fontSize: 16, color: diag.storageCount != null && diag.storageCount !== recordsCount ? "var(--brick)" : "var(--ink)" }}>{diag.storageCount ?? "—"}</div>
            </div>
            <div style={{ background: "var(--paper)", borderRadius: 8, padding: 10 }}>
              <div style={{ color: "var(--ink-soft)", fontSize: 11 }}>Última carga desde almacenamiento</div>
              <div style={{ fontWeight: 600 }}>{diag.ultimaCarga ? diag.ultimaCarga.toLocaleTimeString("es-CO") : "—"}</div>
            </div>
            <div style={{ background: "var(--paper)", borderRadius: 8, padding: 10 }}>
              <div style={{ color: "var(--ink-soft)", fontSize: 11 }}>Último guardado exitoso</div>
              <div style={{ fontWeight: 600 }}>{diag.ultimoGuardado ? diag.ultimoGuardado.toLocaleTimeString("es-CO") : "—"}</div>
            </div>
          </div>
          {diag.recuperados > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--moss)", fontWeight: 600 }}>Se han recuperado {diag.recuperados} registro(s) que se habían dejado de mostrar en esta sesión.</div>
          )}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onVerificar} disabled={diag.checking} style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: diag.checking ? "wait" : "pointer" }}>
              <RotateCcw size={13} /> {diag.checking ? "Verificando…" : "Verificar consistencia ahora"}
            </button>
            {diag.ultimoResultado && <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{diag.ultimoResultado}</span>}
          </div>
        </section>
      )}
    </div>
  );
}
function Labeled({ label, span2, children }) {
  return (
    <div style={{ gridColumn: span2 ? "span 2" : undefined, display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 600 }}>{label}</span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  IMPORTAR / EXPORTAR                                                 */
/* ------------------------------------------------------------------ */
function aFecha(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const base = new Date(Date.UTC(1899, 11, 30));
    base.setUTCDate(base.getUTCDate() + v);
    return base.toISOString().slice(0, 10);
  }
  const s = String(v ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "";
}

/* ------------------------------------------------------------------ */
/*  PROGRAMACIONES ENVIADAS POR LOS COORDINADORES                       */
/* ------------------------------------------------------------------ */
function normTexto(s) {
  return String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
}

function aNumero(v) {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  let s = String(v ?? "").trim().replace(/[^\d.,-]/g, "");
  if (!s) return 0;
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  else s = s.replace(",", ".");
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

function fechaDeCelda(v) {
  if (v instanceof Date) return new Date(v.getTime() + 12 * 3600 * 1000).toISOString().slice(0, 10);
  return aFecha(v);
}

function categoriaDeProgramacion(txt) {
  return normalizarCategoria(txt);
}

// Reconoce el reporte de programación académica (NOMBRE CATALOGO, NOMBRE DOCENTE,
// TIPO ASIGNACIÓN DOCENTE, horas a pagar...). Devuelve null si el archivo no tiene ese formato.
function parsearProgramacion(wb, nombreArchivo, programas, records, tarifas, usuario) {
  for (const hoja of wb.SheetNames) {
    const filas = XLSX.utils.sheet_to_json(wb.Sheets[hoja], { header: 1, defval: null, raw: true });
    const iHead = filas.findIndex((f) => f.some((c) => normTexto(c) === "NOMBRE CATALOGO") && f.some((c) => normTexto(c).startsWith("NOMBRE DOCENTE")));
    if (iHead < 0) continue;

    const head = filas[iHead].map(normTexto);
    const sub = (filas[iHead + 1] || []).map(normTexto);
    const col = (...nombres) => {
      for (const n of nombres) {
        const i = head.findIndex((h) => h === n || h.startsWith(n));
        if (i >= 0) return i;
      }
      return -1;
    };
    const c = {
      programa: col("NOMBRE PROGRAMA"), plan: col("PLAN ACADEMICO"),
      modulo: col("NOMBRE CATALOGO"), semestre: col("SEMESTRE"),
      inicio: col("FECHA INICIO"), fin: col("FECHA FINAL"),
      docente: col("NOMBRE DOCENTE"), tipoAsig: col("TIPO ASIGNACION"),
      categoria: col("CATEGORIA"), pago: col("PAGO"), valor: col("VALOR HORA"),
      horasBonif: col("HORAS PAGAR BONIFICACION"), horasOps: col("HORAS PAGAR OPS"),
      carga: col("CARGA DE TRABAJO"),
    };
    const cSi = c.pago >= 0 ? sub.findIndex((x, i) => i >= c.pago && x === "SI") : -1;
    const cNo = c.pago >= 0 ? sub.findIndex((x, i) => i >= c.pago && x === "NO") : -1;
    const cHorasPagar = sub.findIndex((x) => x.startsWith("HORAS A PAGAR"));
    const cNota = cHorasPagar >= 0 ? cHorasPagar + 1 : -1;

    // Correo y teléfono de docentes que ya están registrados, y la categoría con la que ya figuran
    const contactos = new Map();
    const categoriasConocidas = new Map();
    records.forEach((r) => {
      const k = normTexto(r.docente);
      if (k && !contactos.has(k) && (r.correo || r.telefono)) contactos.set(k, { correo: r.correo || "", telefono: r.telefono || "" });
      const cat = normalizarCategoria(r.escalafon);
      if (k && cat && !categoriasConocidas.has(k)) categoriasConocidas.set(k, cat);
    });

    const items = [];
    const omitidas = [];
    const conteoProg = {};
    let curProg = "";
    let curPlan = "";

    for (let i = iHead + 1; i < filas.length; i++) {
      const f = filas[i];
      const modulo = String(f[c.modulo] ?? "").trim();
      if (!modulo) continue;
      if (c.programa >= 0 && f[c.programa]) curProg = String(f[c.programa]).trim();
      if (c.plan >= 0 && f[c.plan]) curPlan = String(f[c.plan]).trim();

      const docenteRaw = String(f[c.docente] ?? "").trim();
      const sinDocente = !docenteRaw || /^sin asignar$/i.test(docenteRaw);
      const docente = sinDocente ? "Sin asignar" : docenteRaw;
      const tipoAsig = normTexto(f[c.tipoAsig]);
      const hBonif = c.horasBonif >= 0 ? aNumero(f[c.horasBonif]) : 0;
      const hOps = c.horasOps >= 0 ? aNumero(f[c.horasOps]) : 0;
      const hPagar = cHorasPagar >= 0 ? aNumero(f[cHorasPagar]) : 0;
      const nota = cNota >= 0 && typeof f[cNota] === "string" ? f[cNota].trim() : "";
      const pagaNo = cNo >= 0 && String(f[cNo] ?? "").trim() !== "" && !(cSi >= 0 && String(f[cSi] ?? "").trim() !== "");

      const advertencias = [];
      // Solo es OPS cuando el tipo de asignación docente dice "PRESTACIÓN DE SERVICIOS"; cualquier otro tipo
      // (tiempo completo, medio tiempo, etc.) se registra como bonificación. Si el archivo no trae esa columna
      // o la celda está vacía, se decide con las columnas de horas por pagar.
      let tipo;
      if (tipoAsig) tipo = tipoAsig.includes("PRESTACION DE SERVICIO") ? "OPS" : "BONIFICACION";
      else if (hOps > 0 && hBonif === 0) tipo = "OPS";
      else if (hBonif > 0 && hOps === 0) tipo = "BONIFICACION";
      else { tipo = "OPS"; advertencias.push("El archivo no indica el tipo de asignación docente: revisa si es OPS o bonificación"); }
      // Horas por pagar (solo para saber si el curso se paga en este programa)
      const sinColumnasHoras = c.horasBonif < 0 && c.horasOps < 0;
      const horas = (hOps + hBonif) || (sinColumnasHoras ? hPagar : 0);

      // Las horas del curso son las de la columna CARGA DE TRABAJO; las columnas "horas a pagar" solo deciden
      // si el curso se paga en este programa y si es OPS o bonificación.
      const cargaHoras = c.carga >= 0 ? aNumero(f[c.carga]) : 0;
      const horasFinal = cargaHoras > 0 ? cargaHoras : horas;

      // Sin horas por pagar en las columnas: solo se omite si el archivo lo explica (nota) o no hay carga de trabajo.
      // Si hay carga y ninguna nota, el curso se importa con advertencia para que lo revises.
      const sinHorasPagar = !horas;
      if (pagaNo || (sinHorasPagar && (cargaHoras <= 0 || nota))) {
        omitidas.push({ modulo, docente, motivo: nota || (pagaNo ? "Marcado como PAGO = NO en este programa" : "0 horas por pagar en este programa (horas espejo con otro programa)") });
        continue;
      }

      // Programa: por el código PA del plan académico o por el nombre
      const token = curPlan.split("-")[0].trim().toUpperCase();
      const prog = programas.find((p) => p.pa && String(p.pa).toUpperCase() === token)
        || programas.find((p) => curProg && normTexto(p.nombre) === normTexto(curProg));
      if (prog) conteoProg[prog.sigla] = (conteoProg[prog.sigla] || 0) + 1;
      else advertencias.push(`Programa no identificado en el catálogo (plan: ${curPlan || "—"})`);

      if (sinDocente) advertencias.push("Docente sin asignar");
      const fechaInicio = fechaDeCelda(f[c.inicio]);
      const fechaFin = fechaDeCelda(f[c.fin]);
      if (!fechaInicio || !fechaFin) advertencias.push("Fechas inválidas o incompletas");
      else if (fechaFin < fechaInicio) advertencias.push("Finalización anterior al inicio");

      // El valor hora NO viene del archivo ni del docente: se calcula con la tabla de tarifas según el tipo
      // de programa y la categoría. Si el archivo no trae la categoría, se usa la que el docente ya tiene en
      // la tabla; si tampoco existe, el curso se importa igual y el valor se completa a mano.
      const info = [];
      if (sinHorasPagar) advertencias.push("El archivo no marca horas por pagar: revisa si este curso se paga en este programa");
      if (cargaHoras > 0 && horas && cargaHoras !== horas) info.push(`Carga de trabajo ${cargaHoras} h (el archivo marca ${horas} h por pagar en este programa)`);
      let escalafon = categoriaDeProgramacion(f[c.categoria]);
      if (!escalafon) {
        const conocida = categoriasConocidas.get(normTexto(docente));
        if (conocida) { escalafon = conocida; info.push(`Categoría tomada de los registros del docente (${conocida})`); }
      }
      if (!escalafon) escalafon = "Otros";

      const contacto = contactos.get(normTexto(docente)) || { correo: "", telefono: "" };
      const dup = records.some((r) => normTexto(r.modulo) === normTexto(modulo) && normTexto(r.docente) === normTexto(docente) && r.fechaInicio === fechaInicio);
      if (dup) advertencias.push("Fila duplicada (ya existe en la tabla)");

      items.push({
        advertencias,
        info,
        registro: {
          tipo,
          programa: prog ? prog.sigla : "",
          cohorte: "",
          ciclo: String(f[c.semestre] ?? "").trim(),
          modulo,
          docente,
          correo: contacto.correo,
          telefono: contacto.telefono,
          horas: horasFinal,
          fechaInicio,
          fechaFin,
          escalafon,
          estado: tipo === "OPS" ? ESTADOS.OPS[0] : ESTADOS.BONIFICACION[0],
          actualizador: usuario,
        },
      });
    }

    // Mismo docente + mismo nombre de catálogo (y mismo tipo) = un solo curso: se suman las horas
    // y las fechas abarcan desde la primera sesión hasta la última.
    const DUP = "Fila duplicada (ya existe en la tabla)";
    const grupos = new Map();
    for (const it of items) {
      const r = it.registro;
      const k = [normTexto(r.docente), normTexto(r.modulo), r.tipo].join("|");
      const g = grupos.get(k);
      if (!g) { grupos.set(k, { ...it, advertencias: it.advertencias.filter((a) => a !== DUP), info: [...it.info], registro: { ...r }, filas: 1, horasFilas: [r.horas] }); continue; }
      g.filas += 1;
      g.horasFilas.push(r.horas);
      g.registro.horas += r.horas;
      if (r.fechaInicio && (!g.registro.fechaInicio || r.fechaInicio < g.registro.fechaInicio)) g.registro.fechaInicio = r.fechaInicio;
      if (r.fechaFin && (!g.registro.fechaFin || r.fechaFin > g.registro.fechaFin)) g.registro.fechaFin = r.fechaFin;
      it.advertencias.filter((a) => a !== DUP && !g.advertencias.includes(a)).forEach((a) => g.advertencias.push(a));
      it.info.filter((a) => !g.info.includes(a) && !a.startsWith("Carga de trabajo")).forEach((a) => g.info.push(a));
    }
    const itemsAgrupados = [...grupos.values()].map((g) => {
      const { filas, horasFilas, ...it } = g;
      it.info = it.info.filter((a) => !a.startsWith("Carga de trabajo"));
      if (filas > 1) it.info.unshift(`${filas} filas del archivo sumadas: ${horasFilas.join(" + ")} = ${it.registro.horas} h`);
      const r = it.registro;
      if (records.some((x) => normTexto(x.modulo) === normTexto(r.modulo) && normTexto(x.docente) === normTexto(r.docente) && x.fechaInicio === r.fechaInicio)) it.advertencias.push(DUP);
      return it;
    });
    items.length = 0;
    items.push(...itemsAgrupados);

    const progSigla = Object.entries(conteoProg).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    const m = String(nombreArchivo || "").match(/cohorte[\s_\-]*([\d.]+)/i);
    return { hoja, items, omitidas, progSigla, cohorte: m ? m[1].replace(/\.$/, "") : "" };
  }
  return null;
}

function ImportarView({ records, setRecords, config, tarifas, programas, notify }) {
  const [previa, setPrevia] = useState(null);
  const [modo, setModo] = useState("gestion");
  const [omitidas, setOmitidas] = useState([]);
  const [progDestino, setProgDestino] = useState("");
  const [cohorteDestino, setCohorteDestino] = useState("");
  const [hojas, setHojas] = useState([]);
  const [nombreHoja, setNombreHoja] = useState("");

  async function leerArchivo(file) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { cellDates: true });
    setHojas(wb.SheetNames);
    const prog = parsearProgramacion(wb, file.name, programas, records, tarifas, config.usuarioActual);
    if (prog) {
      setNombreHoja(prog.hoja);
      setModo("programacion");
      setPrevia(prog.items);
      setOmitidas(prog.omitidas);
      setProgDestino(prog.progSigla || programas[0]?.sigla || "");
      setCohorteDestino(prog.cohorte);
      notify(`Programación de coordinador: ${prog.items.length} cursos por importar, ${prog.omitidas.length} omitidos`);
      return;
    }
    setModo("gestion");
    setOmitidas([]);
    const hoja = wb.SheetNames.find((n) => n.toLowerCase().startsWith("gesti")) ?? wb.SheetNames[0];
    if (!hoja) { notify("El archivo no contiene hojas legibles"); return; }
    setNombreHoja(hoja);
    const filas = XLSX.utils.sheet_to_json(wb.Sheets[hoja], { header: 1 });
    // Dos formatos: el Excel que exporta esta misma aplicación (columnas por nombre, un solo encabezado)
    // y el calendario original «Gestión» (columnas por posición, encabezado + subencabezado de documentos).
    const encabezado = (filas[0] || []).map(normTexto);
    const esExportPropio = encabezado.includes("DOCENTE") && encabezado.includes("MODULO O MATERIA");
    let cuerpo;
    if (esExportPropio) {
      const ix = (...nombres) => { for (const n of nombres) { const i = encabezado.indexOf(n); if (i >= 0) return i; } return -1; };
      const c = {
        noOps: ix("NO OPS"), tipo: ix("TIPO VINCULACION"), sigla: ix("PROGRAMA"), nombrePrograma: ix("NOMBRE DIPLOMADO / CURSO"),
        cohorte: ix("COHORTE"), ciclo: ix("CICLO / SEM"), modulo: ix("MODULO O MATERIA"), docente: ix("DOCENTE"), correo: ix("CORREO"),
        horas: ix("HORAS"), inicio: ix("FECHA INICIO"), fin: ix("FECHA FIN"), escalafon: ix("ESCALAFON"), valorHora: ix("VALOR HORA"), estado: ix("ESTADO"),
      };
      const v = (f, k) => (c[k] >= 0 ? f[c[k]] : undefined);
      cuerpo = filas.slice(1).map((f) => {
        const fila = [v(f, "noOps"), v(f, "sigla"), v(f, "cohorte"), v(f, "ciclo"), v(f, "modulo"), v(f, "docente"), v(f, "correo"), "", v(f, "horas"), v(f, "inicio"), v(f, "fin"), v(f, "escalafon"), v(f, "valorHora"), , , , v(f, "estado")];
        fila.extra = { tipo: /BONIF/.test(normTexto(v(f, "tipo"))) ? "BONIFICACION" : "OPS", nombrePrograma: String(v(f, "nombrePrograma") ?? "").trim() };
        return fila;
      });
    } else {
      cuerpo = filas.slice(2);
    }
    const vistos = new Set(records.map((r) => r.noOPS).filter(Boolean));
    const out = [];
    let filasConDatos = 0;

    for (const f of cuerpo) {
      const [noOps, sigla, cohorte, ciclo, modulo, docente, correo, telefono, horas, inicio, fin, escalafon, valorHora, , , , estado] = f;
      // Solo se ignoran las filas totalmente vacías; una fila con datos nunca se descarta en silencio
      const hayDatos = [noOps, sigla, modulo, docente, correo, horas, inicio, fin].some((x) => String(x ?? "").trim() !== "");
      if (!hayDatos) continue;
      filasConDatos += 1;
      const advertencias = [];
      const prog = programas.find((p) => p.sigla.toLowerCase() === String(sigla ?? "").trim().toLowerCase());
      if (!String(sigla ?? "").trim()) advertencias.push(`Sin programa: se asignó ${programas[0].sigla}, corrígelo después`);
      else if (!prog) advertencias.push(`Programa no registrado: ${String(sigla).trim()}`);
      if (!String(docente ?? "").trim()) advertencias.push("Sin docente");
      const correoTexto = String(correo ?? "").trim();
      if (!correoTexto) advertencias.push("Sin correo electrónico");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTexto)) advertencias.push("Correo inválido");
      const fechaInicio = aFecha(inicio);
      const fechaFin = aFecha(fin);
      if (!fechaInicio || !fechaFin) advertencias.push("Fechas inválidas o incompletas");
      else if (fechaFin < fechaInicio) advertencias.push("Finalización anterior al inicio");
      if (!horas) advertencias.push("Sin horas registradas");
      const numeroOps = noOps ? String(noOps).trim() : null;
      if (numeroOps && vistos.has(numeroOps)) advertencias.push("OPS duplicada (ya existe)");
      const tipo = f.extra?.tipo || (numeroOps ? "OPS" : "BONIFICACION");
      const moduloTxt = String(modulo ?? "").trim();
      if (records.some((r) => normTexto(r.modulo) === normTexto(moduloTxt) && normTexto(r.docente) === normTexto(docente) && r.fechaInicio === fechaInicio && r.tipo === tipo)) advertencias.push("Fila duplicada (ya existe en la tabla)");

      out.push({
        advertencias,
        registro: {
          noOPS: numeroOps || undefined,
          tipo,
          nombrePrograma: f.extra?.nombrePrograma || undefined,
          programa: prog ? prog.sigla : programas[0].sigla,
          cohorte: String(cohorte ?? ""),
          ciclo: String(ciclo ?? ""),
          modulo: String(modulo ?? "").trim(),
          docente: String(docente ?? "").trim() || "Sin asignar",
          correo: correoTexto,
          telefono: String(telefono ?? "").trim(),
          horas: Number(horas) || 0,
          fechaInicio,
          fechaFin,
          escalafon: normalizarCategoria(escalafon) || String(escalafon ?? "").trim(),
          valorHora: Number(valorHora) || undefined,
          estado: typeof estado === "string" && estado.trim() ? estado.trim() : (tipo === "OPS" ? ESTADOS.OPS[0] : ESTADOS.BONIFICACION[0]),
          actualizador: config.usuarioActual,
        },
      });
    }
    setPrevia(out);
    const repetidas = out.filter((o) => o.advertencias.some((a) => a.includes("duplicada"))).length;
    notify(`${filasConDatos} filas con datos en la hoja "${hoja}": ${out.length - repetidas} nuevas${repetidas ? ` y ${repetidas} ya existentes (no se importan)` : ""}`);
  }

  function confirmar() {
    if (!previa) return;
    const nuevos = previa
      .filter((p) => !p.advertencias.some((a) => a.includes("duplicada")))
      .map((p) => {
        if (modo !== "programacion") return mkRecord(p.registro, config, tarifas, programas);
        const reg = { ...p.registro, programa: progDestino, cohorte: cohorteDestino.trim() };
        // El valor hora sale de la tarifa por categoría; si no se puede determinar queda en 0 para completarlo a mano
        return mkRecord({ ...reg, valorHora: valorHoraPorCategoria(tarifas, tipoProgDestino, reg.escalafon, reg.tipo) ?? 0 }, config, tarifas, programas);
      });
    setRecords((rs) => [...nuevos, ...rs]);
    setPrevia(null);
    setOmitidas([]);
    const nOps = nuevos.filter((r) => r.tipo === "OPS").length;
    notify(modo === "programacion"
      ? `${nuevos.length} cursos agregados a OPS y Bonificaciones (${nOps} OPS, ${nuevos.length - nOps} bonificaciones)`
      : `${nuevos.length} registros importados sin eliminar información existente`);
    setModo("gestion");
  }

  function exportarFormatoPA() {
    const headerRow1 = ["ID PROGRAMA", "NOMBRE PROGRAMA CON COHORTE", "NOMBRE DOCENTE", "CENTRO DE COSTOS", "NOMBRE CATALOGO", "SEMESTRE", "FECHA INICIO", "FECHA FINAL", "CARGA DE TRABAJO - P-V", "CATEGORIA", "PAGO", "", "VALOR HORA POR CATEGORIA"];
    const headerRow2 = ["", "", "", "", "", "", "", "", "", "", "SI", "NO", ""];
    const filas = records.map((r) => {
      const p = programas.find((pp) => pp.sigla === r.programa);
      const pagado = r.estado === "Pagado";
      return [
        p?.pa ?? "",
        `${r.nombrePrograma || p?.nombre || r.programa}${r.cohorte ? " - Cohorte " + r.cohorte : ""}`,
        r.docente,
        p?.cc ?? "",
        r.modulo,
        r.ciclo,
        fmtDate(r.fechaInicio),
        fmtDate(r.fechaFin),
        r.horas,
        r.escalafon,
        pagado ? "X" : "",
        pagado ? "" : "X",
        r.valorHora,
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...filas]);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
      { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
      { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },
      { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },
      { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } },
      { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } },
      { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } },
      { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } },
      { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } },
      { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } },
    ];
    ws["!cols"] = [{ wch: 12 }, { wch: 34 }, { wch: 22 }, { wch: 14 }, { wch: 26 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 6 }, { wch: 6 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `reporte-carga-academica-${new Date().toISOString().slice(0, 10)}.xlsx`);
    notify("Archivo Excel generado");
  }

  function exportar(tipo) {
    let lista = records;
    if (tipo === "pendientes") lista = records.filter((r) => r.estado !== "Pagado");
    if (tipo === "pagos") lista = records.filter((r) => r.estado === "Pagado");
    if (tipo === "bonificaciones") lista = records.filter((r) => r.tipo === "BONIFICACION");
    if (tipo === "ops") lista = records.filter((r) => r.tipo === "OPS");

    const datos = lista.map((r) => {
      const p = programas.find((pp) => pp.sigla === r.programa);
      return {
        "No OPS": r.noOPS ?? "",
        "Tipo vinculación": r.tipo,
        Programa: p?.sigla ?? "",
        "Nombre diplomado / curso": r.nombrePrograma ?? "",
        PA: p?.pa ?? "",
        "Centro costos": p?.cc ?? "",
        Coordinador: p?.coordinador ?? "",
        Cohorte: r.cohorte,
        "Ciclo / Sem": r.ciclo,
        "Módulo o materia": r.modulo,
        Docente: r.docente,
        Correo: r.correo,
        Horas: r.horas,
        "Fecha inicio": r.fechaInicio,
        "Fecha fin": r.fechaFin,
        Escalafón: r.escalafon,
        "Valor hora": r.valorHora,
        Total: valorTotal(r),
        Estado: r.estado,
        "Documentos completos": r.documentos ? `${Object.values(r.documentos).filter((v) => v === "Recibido" || v === "No aplica").length}/${Object.values(r.documentos).length}` : "N/A",
        Actualizador: r.actualizador,
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos), "Gestión");
    XLSX.writeFile(wb, `gestion-ops-${tipo}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    notify("Archivo Excel generado");
  }

  const conAdvertencias = previa?.filter((p) => p.advertencias.length > 0).length ?? 0;
  const tipoProgDestino = (programas.find((p) => p.sigla === progDestino) || {}).tipo || "";
  const valorPrevio = (p) => valorHoraPorCategoria(tarifas, tipoProgDestino, p.registro.escalafon, p.registro.tipo);
  const sinValor = modo === "programacion" ? (previa || []).filter((p) => !valorPrevio(p)).length : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Banner arte="datos" desde="#EA580C" hasta="#DB2777" titulo="Importar / Exportar" subtitulo="Carga el Excel de los coordinadores o el calendario actual, y genera reportes en Excel." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <section style={cardStyle}>
          <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}><Upload size={14} /> Importar Excel</div>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10 }}>
            Se reconoce la hoja <b>Gestión</b> con la estructura actual (No OPS, Programa, Cohorte, Ciclo, Módulo, Nombre, Correo, Teléfono, Horas, Fechas, Escalafón, Valor hora, Estado). Los registros sin número de OPS se clasifican como bonificación.
          </p>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10 }}>
            <b>También recibe las programaciones que envían los coordinadores</b> (reporte con Nombre catálogo, Nombre docente, Tipo de asignación y horas a pagar). Se agregan a la tabla de OPS y Bonificaciones sin tocar lo que ya existe.
          </p>
          <input type="file" accept=".xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) leerArchivo(f); }} style={{ width: "100%", border: "1px solid var(--line-strong)", borderRadius: 8, padding: 8, fontSize: 12.5, background: "var(--paper)" }} />
          {hojas.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {hojas.map((h) => <Pill key={h} tone={h === nombreHoja ? "moss" : "neutral"}>Hoja: {h}</Pill>)}
            </div>
          )}
        </section>

        <section style={cardStyle}>
          <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 7 }}><Download size={14} /> Exportar a Excel</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[["todos", "Todos los registros"], ["ops", "Solo OPS"], ["bonificaciones", "Bonificaciones"], ["pendientes", "Pendientes"], ["pagos", "Pagos realizados"]].map(([k, label]) => (
              <button key={k} onClick={() => exportar(k)} style={{ border: "1px solid var(--line-strong)", background: "var(--paper-raised)", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
          <div style={{ height: 1, background: "var(--line)", margin: "14px 0" }} />
          <button onClick={exportarFormatoPA} style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid var(--gold)", background: "var(--gold-soft)", color: "var(--gold)", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            <FileSpreadsheet size={14} /> Exportar formato carga académica (PA)
          </button>
          <p style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-soft)" }}>Genera el reporte con las columnas: ID Programa, Nombre programa con cohorte, Centro de costos, Nombre catálogo, Semestre, Fechas, Carga de trabajo, Categoría, Pago (Sí/No) y Valor hora por categoría.</p>
        </section>
      </div>

      {previa && (
        <section style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, borderBottom: "1px solid var(--line)", padding: "12px 16px" }}>
            <FileSpreadsheet size={15} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>Vista previa ({previa.length} filas)</span>
            {conAdvertencias > 0 && <Pill tone="amber">{conAdvertencias} fila(s) con advertencias</Pill>}
            {sinValor > 0 && <Pill tone="gold">{sinValor} sin valor hora (se completa a mano)</Pill>}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button onClick={() => { setPrevia(null); setOmitidas([]); setModo("gestion"); }} style={{ border: "1px solid var(--line-strong)", background: "var(--paper-raised)", borderRadius: 8, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmar} style={{ border: "none", background: "var(--moss)", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Confirmar importación</button>
            </div>
          </header>
          {modo === "programacion" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--gold-soft)" }}>
              <div style={{ fontSize: 12.5, flex: "1 1 260px" }}>
                <b>Programación de coordinador detectada.</b> Es OPS solo cuando el tipo de asignación docente dice «Prestación de servicios»; los demás tipos se agregan como bonificación. El valor hora que trae el archivo no se usa: se calcula con la tarifa del tipo de programa y la categoría del docente. Los datos que falten no impiden subir la información: se completan manualmente. Las filas duplicadas no se importan.
              </div>
              <label style={{ fontSize: 11.5, fontWeight: 600 }}>Programa<br />
                <select value={progDestino} onChange={(e) => setProgDestino(e.target.value)} style={inputStyle}>
                  {programas.map((p) => <option key={p.sigla} value={p.sigla}>{p.sigla} · {p.nombre}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11.5, fontWeight: 600 }}>Cohorte<br />
                <input value={cohorteDestino} onChange={(e) => setCohorteDestino(e.target.value)} placeholder="Ej. 5" style={{ ...inputStyle, width: 90 }} />
              </label>
            </div>
          )}
          <div style={{ maxHeight: 420, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 800 }}>
              <thead>
                <tr style={{ background: "var(--paper)", textAlign: "left" }}>
                  {["OPS", "Tipo", "Docente", "Curso", "Fechas", "Horas", "Valor", "Advertencias"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previa.map((p, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={tdStyle}>{p.registro.noOPS ?? "—"}</td>
                    <td style={tdStyle}>{p.registro.tipo}</td>
                    <td style={tdStyle}>{p.registro.docente}</td>
                    <td style={{ ...tdStyle, color: "var(--ink-soft)" }}>{p.registro.modulo}</td>
                    <td style={tdStyle}>{fmtDate(p.registro.fechaInicio)} → {fmtDate(p.registro.fechaFin)}</td>
                    <td style={tdStyle}>{p.registro.horas}</td>
                    <td className="font-mono" style={tdStyle}>{modo === "programacion" ? (() => {
                      const v = valorPrevio(p);
                      return v
                        ? <><div>{COP((p.registro.horas || 0) * v)}</div><div style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>{COP(v)}/h · {p.registro.escalafon}</div></>
                        : <span style={{ color: "var(--gold)" }}>Completar a mano</span>;
                    })() : (p.registro.valorHora === 0 ? "Completar a mano" : p.registro.valorHora ? COP((p.registro.horas || 0) * p.registro.valorHora) : "Según tarifa")}</td>
                    <td style={{ ...tdStyle, fontSize: 11.5 }}>
                      {p.advertencias.length > 0 && <div style={{ color: "var(--brick)" }}>{p.advertencias.join(" · ")}</div>}
                      {modo === "programacion" && !valorPrevio(p) && <div style={{ color: "var(--gold)" }}>Sin tarifa para «{p.registro.escalafon}» en este programa</div>}
                      {(p.info || []).length > 0 && <div style={{ color: "var(--ink-soft)" }}>{p.info.join(" · ")}</div>}
                      {p.advertencias.length === 0 && !(p.info || []).length && !(modo === "programacion" && !valorPrevio(p)) && "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {previa && omitidas.length > 0 && (
        <section style={{ ...cardStyle, borderLeft: "3px solid var(--amber)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>No se importan {omitidas.length} curso{omitidas.length === 1 ? "" : "s"}</div>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}>No generan pago en este programa según la programación. Revísalos por si alguno sí debe pagarse aquí.</p>
          {omitidas.map((o, i) => (
            <div key={i} style={{ fontSize: 12.5, padding: "5px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
              <b>{o.modulo}</b> <span style={{ color: "var(--ink-soft)" }}>({o.docente})</span>: {o.motivo}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DETAIL DRAWER                                                       */
/* ------------------------------------------------------------------ */
function DetailDrawer({ rec, config, programas, hallazgos = [], onIrAuditor, onClose, onUpdateDoc, onAdvance, onRetroceder, onEdit, onDelete, emailDraft, setEmailDraft, onSend, onDraft, onCopy }) {
  const prog = programas.find((p) => p.sigla === rec.programa) || { sigla: rec.programa, nombre: rec.programa, tipo: "", pa: "—", cc: "—", coordinador: "—", correo: "—" };
  const u = urgencia(rec);
  const seq = ESTADOS[rec.tipo];
  const idx = idxEstado(rec.tipo, rec.estado);
  const liqSS = liquidacionSS(rec, config);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [revisionAbierta, setRevisionAbierta] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(27,23,64,0.35)" }} />
      <div className="font-body" style={{ position: "relative", width: 460, maxWidth: "92vw", height: "100%", background: "var(--paper)", overflowY: "auto", padding: "22px 24px 60px", borderLeft: "1px solid var(--line)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 999, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={15} /></button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingRight: 40 }}>
          <Pill tone={rec.tipo === "OPS" ? "neutral" : "gold"}>{rec.tipo === "OPS" ? "OPS" : "BONIFICACIÓN — sin documentos"}</Pill>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onEdit(rec)} style={{ fontSize: 12, fontWeight: 600, border: "1px solid var(--line-strong)", background: "var(--paper-raised)", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>Editar</button>
            <button onClick={() => setConfirmDelete(true)} style={{ fontSize: 12, fontWeight: 600, border: "1px solid var(--brick)", color: "var(--brick)", background: "var(--brick-soft)", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>Eliminar</button>
          </div>
        </div>

        {confirmDelete && (
          <div style={{ marginTop: 12, background: "var(--brick-soft)", border: "1px solid var(--brick)", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12.5, color: "var(--ink)", marginBottom: 8 }}>¿Eliminar este registro de forma permanente? Esta acción no se puede deshacer.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onDelete(rec.id)} style={{ flex: 1, background: "var(--brick)", color: "#fff", border: "none", borderRadius: 7, padding: "7px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Sí, eliminar</button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, background: "var(--paper-raised)", border: "1px solid var(--line-strong)", borderRadius: 7, padding: "7px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        )}

        <div className="font-display" style={{ fontSize: 22, fontWeight: 600, marginTop: 10 }}>{rec.docente}</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{rec.modulo}</div>
        <div style={{ marginTop: 8 }}><Pill tone={UrgTone(u.level)}>{u.label}</Pill></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18, fontSize: 12.5 }}>
          <Field label="Programa" value={`${prog.sigla} · ${rec.nombrePrograma || prog.nombre}`} span2 />
          <Field label="No. OPS" value={rec.noOPS || "N/A"} />
          <Field label="Escalafón" value={rec.escalafon} />
          <Field label="Fecha inicio" value={fmtDate(rec.fechaInicio)} />
          <Field label="Fecha fin" value={fmtDate(rec.fechaFin)} />
          <Field label="Horas" value={rec.horas} />
          <Field label="Valor hora" value={COP(rec.valorHora)} />
          <Field label="Valor total" value={COP(valorTotal(rec))} mono />
          <Field label="Coordinador" value={prog.coordinador} span2 />
          {rec.tipo === "OPS" && (
            <div style={{ gridColumn: "1 / -1", background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>Seguridad social (mes completo)</div>
              <PanelSS liq={liqSS} config={config} />
            </div>
          )}
        </div>

        <AvisoAuditoria hallazgos={hallazgos} onIr={onIrAuditor} />

        {/* ESTADO STEPPER */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>Estado del proceso</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {seq.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: i <= idx ? "var(--moss)" : "var(--line-strong)", flexShrink: 0 }} />
                  {i < seq.length - 1 && <span style={{ width: 2, height: 20, background: i < idx ? "var(--moss)" : "var(--line-strong)" }} />}
                </div>
                <span style={{ fontSize: 12.5, padding: "2px 0", color: i <= idx ? "var(--ink)" : "var(--ink-soft)", fontWeight: i === idx ? 700 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {idx > 0 && (
              <button onClick={() => onRetroceder(rec.id)} className="font-body" style={{ background: "var(--paper-raised)", color: "var(--ink)", border: "1.5px solid var(--line-strong)", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                ← Devolver a "{seq[idx - 1]}"
              </button>
            )}
            {rec.estado !== "Pagado" && (
              <button onClick={() => onAdvance(rec.id)} className="font-body" style={{ background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                Avanzar a "{seq[idx + 1]}"
              </button>
            )}
          </div>
        </div>

        {/* DOCUMENTOS */}
        {rec.tipo === "OPS" && rec.documentos && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>Documentos</span>
                <button onClick={() => setRevisionAbierta(true)} className="font-body" style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--ink)", color: "#fff", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  <Sparkles size={12} /> Cargar y revisar con IA
                </button>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: docsPct(rec) === 100 ? "var(--moss)" : "var(--amber)" }}>{Object.values(rec.documentos).filter((v) => v === "Recibido" || v === "No aplica").length}/{Object.keys(rec.documentos).length} · {docsPct(rec)}%</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(rec.documentos).map(([label, st]) => (
                <button key={label} onClick={() => onUpdateDoc(rec.id, label, siguienteEstadoDoc(st))} title="Toca para cambiar: Pendiente → Recibido → No aplica"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
                  <span style={{ fontSize: 12.5 }}>{label}</span>
                  <Pill tone={st === "Recibido" ? "moss" : st === "No aplica" ? "neutral" : "amber"}>{st}</Pill>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VISTO BUENO / EMAIL */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>Vistos buenos</div>
          {!emailDraft ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => setEmailDraft(emailTemplate(rec, config, programas))} className="font-body" style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                <Mail size={14} /> Solicitar visto bueno al coordinador
              </button>
              {rec.tipo === "BONIFICACION" && (
                <button onClick={() => setEmailDraft(emailFormatoBonificacionTemplate(rec, config, programas))} className="font-body" style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper-raised)", color: "var(--ink)", border: "1.5px solid var(--gold)", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  <Mail size={14} /> Pedir al docente diligenciar formato de bonificación
                </button>
              )}
              {daysDiff(rec.fechaFin) <= 0 && (
                <button onClick={() => setEmailDraft(emailDecanaTemplate(rec, config, programas))} className="font-body" style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper-raised)", color: "var(--ink)", border: "1.5px solid var(--ink)", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  <Mail size={14} /> Enviar a la Decana para aprobación y nómina
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                {emailDraft.tipo === "decana" ? "Para la Decana" : (emailDraft.tipo === "bonificacion" || emailDraft.tipo === "pendientes") ? "Para el docente" : "Para el coordinador"}: {emailDraft.para}
              </div>
              <input value={emailDraft.asunto} onChange={(e) => setEmailDraft({ ...emailDraft, asunto: e.target.value })} className="font-body" style={{ fontSize: 12.5, fontWeight: 600, border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px" }} />
              <textarea value={emailDraft.cuerpo} onChange={(e) => setEmailDraft({ ...emailDraft, cuerpo: e.target.value })} rows={10} className="font-body" style={{ fontSize: 12, border: "1px solid var(--line)", borderRadius: 6, padding: 8, resize: "vertical" }} />
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>"Enviar correo" intenta abrir tu app de correo. Si no pasa nada (común dentro de la app de Claude en el celular), usa "Copiar mensaje" — y si tampoco copia solo, mantén presionado el texto de arriba para seleccionarlo y copiarlo a mano.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`mailto:${encodeURIComponent(emailDraft.para)}?subject=${encodeURIComponent(emailDraft.asunto)}&body=${encodeURIComponent(emailDraft.cuerpo)}`} onClick={onSend}
                  style={{ flex: 1, background: "var(--moss)", color: "#fff", border: "none", borderRadius: 7, padding: "8px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "inline-block" }}>
                  Enviar correo
                </a>
                <button onClick={async () => {
                  const texto = `Para: ${emailDraft.para}\nAsunto: ${emailDraft.asunto}\n\n${emailDraft.cuerpo}`;
                  let ok = false;
                  try {
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(texto);
                      ok = true;
                    }
                  } catch (e) { /* seguimos al respaldo */ }
                  if (!ok) {
                    try {
                      const ta = document.createElement("textarea");
                      ta.value = texto;
                      ta.style.position = "fixed";
                      ta.style.left = "-9999px";
                      document.body.appendChild(ta);
                      ta.focus();
                      ta.select();
                      ok = document.execCommand("copy");
                      document.body.removeChild(ta);
                    } catch (e) { /* sin soporte de copiado automático */ }
                  }
                  onCopy(ok);
                }} style={{ flex: 1, background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: 7, padding: "8px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Copiar mensaje</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {revisionAbierta && (
        <RevisionDocumentosModal
          rec={rec}
          config={config}
          programas={programas}
          onClose={() => setRevisionAbierta(false)}
          onUpdateDoc={onUpdateDoc}
          onPrepararCorreo={(draft) => { setEmailDraft(draft); setRevisionAbierta(false); }}
        />
      )}
    </div>
  );
}
function Field({ label, value, span2, mono }) {
  return (
    <div style={{ gridColumn: span2 ? "span 2" : undefined }}>
      <div style={{ color: "var(--ink-soft)", fontSize: 11 }}>{label}</div>
      <div className={mono ? "font-mono" : undefined} style={{ fontWeight: 600, marginTop: 1 }}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NEW RECORD MODAL                                                    */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  REVISIÓN PRELIMINAR DE DOCUMENTOS CON IA                            */
/* ------------------------------------------------------------------ */
const LIMITE_ARCHIVO_BYTES = 5 * 1024 * 1024;
const DATOS_LABELS = { titular: "Titular", numero_documento: "N.º de documento", fecha_documento: "Fecha", periodo: "Periodo", valor: "Valor", entidad: "Entidad" };

function archivoABase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}

function parsearJSONIA(texto) {
  const limpio = String(texto || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(limpio); } catch (e) {
    const m = limpio.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e2) { /* sin respuesta válida */ } }
  }
  return null;
}

// Reduce las fotos (lado mayor 1600 px) para que pesen poco y la IA las lea sin problema
async function imagenReducidaABase64(file, maxLado = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("No se pudo abrir la imagen"));
      i.src = url;
    });
    const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * escala));
    const h = Math.max(1, Math.round(img.height * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function revisarArchivoConIA(file, rec, prog, docKeys) {
  const esPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  let bloque;
  if (esPdf) {
    bloque = { type: "document", source: { type: "base64", media_type: "application/pdf", data: await archivoABase64(file) } };
  } else {
    let datos;
    let tipoMedia = "image/jpeg";
    try { datos = await imagenReducidaABase64(file); } catch (e) { datos = await archivoABase64(file); tipoMedia = file.type; }
    bloque = { type: "image", source: { type: "base64", media_type: tipoMedia, data: datos } };
  }
  const prompt = `Eres un asistente que hace una revisión PRELIMINAR de documentos de una Orden de Prestación de Servicios (OPS) docente en una universidad colombiana. Una persona revisará y confirmará tu resultado.

Tipos de documento requeridos: ${docKeys.join(" | ")}.

Datos esperados de este registro:
- Docente: ${rec.docente}
- Programa: ${rec.nombrePrograma || prog.nombre}
- Curso: ${rec.modulo}
- Periodo del curso: ${fmtDate(rec.fechaInicio)} a ${fmtDate(rec.fechaFin)}
- Horas: ${rec.horas}
- Valor total de la OPS: ${COP(valorTotal(rec))}
- Número de OPS: ${rec.noOPS || "sin asignar"}

Analiza el archivo adjunto y responde SOLO con un objeto JSON válido (sin texto antes ni después y sin bloques de código) con esta forma exacta:
{"tipo":"<uno de los tipos requeridos, o No identificado>","confianza":"alta|media|baja","legible":true,"datos":{"titular":"","numero_documento":"","fecha_documento":"","periodo":"","valor":"","entidad":""},"alertas":[]}

Criterios para "alertas" (máximo 3, frases cortas): nombre del titular distinto al del docente esperado; valor de una cuenta de cobro distinto al valor total esperado; periodo de una planilla de pago o fechas de vigencia que no correspondan al periodo del curso o estén vencidas; falta de firma o de número de OPS en la OPS firmada; documento ilegible, cortado o incompleto. No inventes datos: deja "" lo que no aparezca en el documento.`;
  const cuerpo = JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: [bloque, { type: "text", text: prompt }] }] });
  let data = null;
  let ultimoError = "";
  for (let intento = 0; intento < 3; intento++) {
    if (intento > 0) await new Promise((r) => setTimeout(r, 2500 * intento));
    let response;
    try {
      response = await fetch("api/ia", { method: "POST", headers: { "Content-Type": "application/json", ...(window.__gopsAuth ? window.__gopsAuth() : {}) }, body: cuerpo });
    } catch (e) {
      ultimoError = "No se pudo conectar con la IA. Revisa tu conexión e inténtalo de nuevo.";
      continue;
    }
    let json = null;
    try { json = await response.json(); } catch (e) { json = null; }
    if (response.ok && json && !json.error) { data = json; break; }
    const detalle = (json && json.error && json.error.message) || `HTTP ${response.status}`;
    if (response.status === 429 || response.status === 529 || response.status >= 500) {
      ultimoError = `La IA está ocupada o limitó las solicitudes (${detalle}). Espera un minuto y toca Reintentar.`;
      continue;
    }
    const d = detalle.toLowerCase();
    if (response.status === 413 || d.includes("too large") || d.includes("exceed") || d.includes("size")) throw new Error(`El archivo es demasiado grande para la revisión (${detalle}). Redúcelo o clasifícalo a mano.`);
    if (d.includes("password") || d.includes("encrypt") || d.includes("protected")) throw new Error(`El PDF está protegido con contraseña (${detalle}). Descárgalo sin protección o clasifícalo a mano.`);
    if (d.includes("pdf") || d.includes("document")) throw new Error(`No se pudo leer el PDF (${detalle}). Puede estar dañado o protegido; clasifícalo a mano.`);
    throw new Error(detalle);
  }
  if (!data) throw new Error(ultimoError || "La IA no respondió");
  const texto = (data.content || []).map((i) => (i.type === "text" ? i.text : "")).join("\n");
  const res = parsearJSONIA(texto);
  if (!res) {
    return { tipo: "No identificado", confianza: "baja", legible: true, datos: {}, alertas: [`La IA no devolvió un resultado estructurado: ${String(texto).slice(0, 160) || "respuesta vacía"}. Clasifícalo a mano.`] };
  }
  return {
    tipo: typeof res.tipo === "string" ? res.tipo : "No identificado",
    confianza: res.confianza || "baja",
    legible: res.legible !== false,
    datos: res.datos && typeof res.datos === "object" ? res.datos : {},
    alertas: Array.isArray(res.alertas) ? res.alertas.filter(Boolean).map(String).slice(0, 5) : [],
  };
}

function RevisionDocumentosModal({ rec, config, programas, onClose, onUpdateDoc, onPrepararCorreo }) {
  const prog = programas.find((p) => p.sigla === rec.programa) || { sigla: rec.programa, nombre: rec.programa, tipo: "", pa: "—", cc: "—", coordinador: "—", correo: "—" };
  const docKeys = Object.keys(rec.documentos || {});
  const [items, setItems] = useState([]);
  const [analizando, setAnalizando] = useState(false);
  const [aceptados, setAceptados] = useState({});
  const [confirmado, setConfirmado] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  function agregarArchivos(lista) {
    const nuevos = Array.from(lista || []).map((f) => {
      const esPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      const esImg = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(f.type);
      let estado = "pendiente";
      let error = "";
      if (!esPdf && !esImg) { estado = "no_soportado"; error = "Formato no soportado por la revisión automática (usa PDF o imagen). Revísalo manualmente."; }
      else if (f.size > LIMITE_ARCHIVO_BYTES) { estado = "no_soportado"; error = "Supera los 5 MB. Revísalo manualmente o comprímelo."; }
      return { id: generarId(), file: f, estado, error, resultado: null, tipoElegido: "" };
    });
    if (nuevos.length) { setItems((cur) => [...cur, ...nuevos]); setConfirmado(false); }
  }
  function quitar(id) { setItems((cur) => cur.filter((x) => x.id !== id)); }
  function reintentar(id) { setItems((cur) => cur.map((x) => x.id === id ? { ...x, estado: "pendiente", error: "" } : x)); }
  function cambiarTipo(id, tipo) { setItems((cur) => cur.map((x) => x.id === id ? { ...x, tipoElegido: tipo } : x)); }

  async function revisar() {
    setAnalizando(true);
    const pendientesRevisar = items.filter((x) => x.estado === "pendiente");
    for (const it of pendientesRevisar) {
      setItems((cur) => cur.map((x) => x.id === it.id ? { ...x, estado: "analizando" } : x));
      try {
        const res = await revisarArchivoConIA(it.file, rec, prog, docKeys);
        const tipo = docKeys.includes(res.tipo) ? res.tipo : "";
        setItems((cur) => cur.map((x) => x.id === it.id ? { ...x, estado: "listo", resultado: res, tipoElegido: tipo } : x));
      } catch (e) {
        setItems((cur) => cur.map((x) => x.id === it.id ? { ...x, estado: "error", error: e.message || "Error al revisar" } : x));
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    setAnalizando(false);
  }

  const hayPorRevisar = items.some((x) => x.estado === "pendiente");
  const hayResultados = items.some((x) => x.estado === "listo" || ((x.estado === "error" || x.estado === "no_soportado") && x.tipoElegido));

  const propuesta = docKeys.map((key) => {
    const archivos = items.filter((x) => x.tipoElegido === key && (x.estado === "listo" || x.estado === "error" || x.estado === "no_soportado"));
    const conAlertas = archivos.some((x) => x.resultado && x.resultado.alertas.length > 0);
    const estadoActual = rec.documentos[key];
    const porDefecto = archivos.length > 0 && !conAlertas && estadoActual !== "Recibido";
    const marcado = aceptados[key] !== undefined ? aceptados[key] : porDefecto;
    return { key, archivos, conAlertas, estadoActual, marcado };
  });
  const aActualizar = propuesta.filter((p) => p.marcado && p.archivos.length > 0 && p.estadoActual !== "Recibido");

  function confirmar() {
    aActualizar.forEach((p) => onUpdateDoc(rec.id, p.key, "Recibido"));
    setConfirmado(true);
  }

  const pendientes = docKeys.filter((k) => rec.documentos[k] === "Pendiente");
  const observaciones = [];
  items.filter((x) => x.estado === "listo" && x.resultado.alertas.length > 0).forEach((x) => {
    const p = propuesta.find((pp) => pp.key === x.tipoElegido);
    if (!(p && p.marcado)) x.resultado.alertas.forEach((a) => observaciones.push(`${x.tipoElegido || x.file.name}: ${a}`));
  });

  const tituloPaso = { fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(27,23,64,0.45)" }} />
      <div className="font-body" style={{ position: "relative", background: "var(--paper)", borderRadius: 16, padding: 24, width: 780, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>Revisión de documentos recibidos</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3 }}>{rec.docente} · {rec.noOPS || "OPS"} · {rec.modulo}</div>
          </div>
          <button onClick={onClose} style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 999, width: 30, height: 30, cursor: "pointer", flexShrink: 0 }}><X size={15} /></button>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--amber)", background: "var(--amber-soft)", borderRadius: 8, padding: "8px 10px", marginBottom: 16 }}>
          Los archivos se envían a la IA de Claude solo para esta revisión; la aplicación no los guarda. Incluyen datos personales: confirma que son del docente correcto. La revisión es preliminar y puede equivocarse: el checklist solo cambia cuando tú lo confirmas.
        </div>

        {/* PASO 1 */}
        <div style={tituloPaso}>Paso 1 · Cargar los documentos recibidos</div>
        <label onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }} onDragLeave={() => setArrastrando(false)} onDrop={(e) => { e.preventDefault(); setArrastrando(false); agregarArchivos(e.dataTransfer.files); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: `2px dashed ${arrastrando ? "var(--moss)" : "var(--line-strong)"}`, borderRadius: 12, padding: "18px 12px", cursor: "pointer", background: arrastrando ? "var(--moss-soft)" : "var(--paper-raised)", textAlign: "center" }}>
          <Upload size={20} style={{ color: "var(--ink-soft)" }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Arrastra aquí los archivos o haz clic para elegirlos</span>
          <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>PDF o imágenes (JPG, PNG), máximo 5 MB cada uno</span>
          <input type="file" multiple accept=".pdf,image/png,image/jpeg,image/gif,image/webp" onChange={(e) => { agregarArchivos(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
        </label>

        {items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {items.map((it) => {
              const tonos = { pendiente: "neutral", analizando: "gold", listo: "moss", error: "brick", no_soportado: "amber" };
              const textos = { pendiente: "En espera", analizando: "Analizando…", listo: "Revisado", error: "Error", no_soportado: "No revisable" };
              return (
                <div key={it.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, background: "var(--paper-raised)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileCheck2 size={15} style={{ color: "var(--ink-soft)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.file.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{Math.max(1, Math.round(it.file.size / 1024))} KB</div>
                    </div>
                    <Pill tone={tonos[it.estado]}>{textos[it.estado]}</Pill>
                    {!analizando && <button onClick={() => quitar(it.id)} title="Quitar" style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: "var(--ink-soft)" }} /></button>}
                  </div>
                  {(it.estado === "error" || it.estado === "no_soportado") && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 11.5, color: "var(--brick)" }}>{it.error}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                        {it.estado === "error" && !analizando && (
                          <button onClick={() => reintentar(it.id)} style={{ background: "var(--paper)", border: "1px solid var(--line-strong)", borderRadius: 7, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Reintentar</button>
                        )}
                        <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>o clasifícalo a mano:</span>
                        <select value={it.tipoElegido} onChange={(e) => cambiarTipo(it.id, e.target.value)} style={{ ...inputStyle, width: "auto", padding: "5px 8px", fontSize: 12 }}>
                          <option value="">Sin clasificar</option>
                          {docKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  {it.estado === "listo" && it.resultado && (
                    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 3 }}>Tipo de documento detectado</div>
                        <select value={it.tipoElegido} onChange={(e) => cambiarTipo(it.id, e.target.value)} style={inputStyle}>
                          <option value="">Sin clasificar</option>
                          {docKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                        </select>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <Pill tone={it.resultado.confianza === "alta" ? "moss" : it.resultado.confianza === "media" ? "amber" : "brick"}>Confianza {it.resultado.confianza}</Pill>
                          {!it.resultado.legible && <Pill tone="brick">Poco legible</Pill>}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 3 }}>Datos extraídos</div>
                        {Object.entries(it.resultado.datos).filter(([, v]) => v).length === 0 ? (
                          <div style={{ color: "var(--ink-soft)" }}>—</div>
                        ) : Object.entries(it.resultado.datos).filter(([, v]) => v).map(([k, v]) => (
                          <div key={k}><span style={{ color: "var(--ink-soft)" }}>{DATOS_LABELS[k] || k}:</span> {String(v)}</div>
                        ))}
                      </div>
                      {it.resultado.alertas.length > 0 && (
                        <div style={{ gridColumn: "span 2", background: "var(--amber-soft)", borderRadius: 8, padding: "8px 10px" }}>
                          {it.resultado.alertas.map((a, i) => (
                            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", color: "var(--ink)" }}><AlertTriangle size={13} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }} /> {a}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PASO 2 */}
        <div style={{ ...tituloPaso, marginTop: 18 }}>Paso 2 · Revisión preliminar con IA</div>
        <button onClick={revisar} disabled={analizando || !hayPorRevisar} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--ink)", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: analizando || !hayPorRevisar ? "not-allowed" : "pointer", opacity: analizando || !hayPorRevisar ? 0.5 : 1 }}>
          <Sparkles size={15} /> {analizando ? "Revisando documentos…" : "Revisar con IA"}
        </button>

        {/* PASO 3 */}
        {hayResultados && (
          <>
            <div style={{ ...tituloPaso, marginTop: 18 }}>Paso 3 · Confirma el checklist</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {propuesta.map((p) => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{p.key}</div>
                  <Pill tone={p.estadoActual === "Recibido" ? "moss" : p.estadoActual === "No aplica" ? "neutral" : "amber"}>{p.estadoActual}</Pill>
                  {p.estadoActual === "Recibido" ? (
                    <span style={{ fontSize: 11.5, color: "var(--ink-soft)", minWidth: 190 }}>Ya estaba recibido</span>
                  ) : p.archivos.length === 0 ? (
                    <span style={{ fontSize: 11.5, color: "var(--ink-soft)", minWidth: 190 }}>Sin archivo para este documento</span>
                  ) : (
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, minWidth: 190, cursor: "pointer" }}>
                      <input type="checkbox" checked={p.marcado} disabled={confirmado} onChange={(e) => setAceptados((a) => ({ ...a, [p.key]: e.target.checked }))} />
                      Marcar como Recibido{p.conAlertas ? " (con alertas)" : ""}
                    </label>
                  )}
                </div>
              ))}
            </div>
            {!confirmado && (
              <button onClick={confirmar} style={{ marginTop: 12, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 11, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {aActualizar.length > 0 ? `Confirmar y actualizar ${aActualizar.length} documento${aActualizar.length === 1 ? "" : "s"}` : "Confirmar sin cambios en el checklist"}
              </button>
            )}
          </>
        )}

        {/* PASO 4 */}
        {confirmado && (
          <>
            <div style={{ ...tituloPaso, marginTop: 18 }}>Paso 4 · Siguiente acción</div>
            {pendientes.length > 0 ? (
              <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderLeft: "3px solid var(--amber)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Faltan {pendientes.length} documento{pendientes.length === 1 ? "" : "s"}</div>
                <ul style={{ margin: "0 0 10px 18px", padding: 0, fontSize: 12.5 }}>
                  {pendientes.map((d) => <li key={d}>{d}</li>)}
                </ul>
                {!rec.correo && <div style={{ fontSize: 11.5, color: "var(--brick)", marginBottom: 8 }}>Este registro no tiene correo del docente: podrás escribirlo en el borrador.</div>}
                <button onClick={() => onPrepararCorreo(emailPendientesTemplate(rec, config, programas, pendientes, observaciones))} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <Mail size={14} /> Preparar correo al docente con los pendientes
                </button>
              </div>
            ) : (
              <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderLeft: "3px solid var(--moss)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--moss)" }}>Documentación completa</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10 }}>Siguiente etapa del proceso de OPS: visto bueno del director o coordinador.</div>
                <button onClick={() => onPrepararCorreo(emailTemplate(rec, config, programas))} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <Mail size={14} /> Preparar solicitud de visto bueno al coordinador
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MasivoModal({ draft, setDraft, onClose, onSend, onCopy }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 75, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(27,23,64,0.4)" }} />
      <div className="font-body" style={{ position: "relative", background: "var(--paper)", borderRadius: 16, padding: 24, width: 620, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span className="font-display" style={{ fontSize: 19, fontWeight: 600 }}>Correo consolidado para la Decana</span>
          <button onClick={onClose} style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 999, width: 30, height: 30, cursor: "pointer" }}><X size={15} /></button>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 10 }}>Para: {draft.para}</div>
        <input value={draft.asunto} onChange={(e) => setDraft({ ...draft, asunto: e.target.value })} className="font-body" style={{ width: "100%", fontSize: 13, fontWeight: 600, border: "1px solid var(--line-strong)", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }} />
        <textarea value={draft.cuerpo} onChange={(e) => setDraft({ ...draft, cuerpo: e.target.value })} rows={14} className="font-mono" style={{ width: "100%", fontSize: 12, border: "1px solid var(--line-strong)", borderRadius: 8, padding: 10, resize: "vertical" }} />
        <div style={{ fontSize: 11, color: "var(--ink-soft)", margin: "8px 0" }}>Puedes editar la lista antes de enviarlo. "Enviar correo" intenta abrir tu app de correo; si no pasa nada, usa "Copiar mensaje" y pégalo tú mismo.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={`mailto:${encodeURIComponent(draft.para)}?subject=${encodeURIComponent(draft.asunto)}&body=${encodeURIComponent(draft.cuerpo)}`} onClick={onSend}
            style={{ flex: 1, background: "var(--moss)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "inline-block" }}>
            Enviar correo
          </a>
          <button onClick={async () => {
            const texto = `Para: ${draft.para}\nAsunto: ${draft.asunto}\n\n${draft.cuerpo}`;
            let ok = false;
            try {
              if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(texto); ok = true; }
            } catch (e) { /* seguimos al respaldo */ }
            if (!ok) {
              try {
                const ta = document.createElement("textarea");
                ta.value = texto; ta.style.position = "fixed"; ta.style.left = "-9999px";
                document.body.appendChild(ta); ta.focus(); ta.select();
                ok = document.execCommand("copy");
                document.body.removeChild(ta);
              } catch (e) { /* sin soporte de copiado automático */ }
            }
            onCopy(ok);
          }} style={{ flex: 1, background: "var(--paper-raised)", border: "1px solid var(--line-strong)", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Copiar mensaje
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordModal({ config, tarifas, programas, record, onClose, onSave, onDelete }) {
  const editando = !!record;
  const [form, setForm] = useState(() => record ? {
    tipo: record.tipo, programa: record.programa, nombrePrograma: record.nombrePrograma || "", noOPS: record.noOPS || "", cohorte: record.cohorte || "", ciclo: record.ciclo || "",
    modulo: record.modulo, docente: record.docente, correo: record.correo || "", horas: String(record.horas),
    escalafon: record.escalafon || "Maestría", fechaInicio: record.fechaInicio, fechaFin: record.fechaFin, valorHoraManual: String(record.valorHora),
  } : { tipo: "OPS", programa: programas[0]?.sigla || "", nombrePrograma: "", noOPS: "", cohorte: "", ciclo: "", modulo: "", docente: "", correo: "", horas: "", escalafon: "Maestría", fechaInicio: "", fechaFin: "", valorHoraManual: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const prog = programas.find((p) => p.sigla === form.programa) || { sigla: "", nombre: "(agrega un programa primero)", tipo: NIVELES_ACADEMICOS[0], pa: "—", cc: "—", coordinador: "—", correo: "—" };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const tarifa = tarifaDe(tarifas, prog.tipo, form.escalafon);
  const valorHoraSugerido = form.tipo === "OPS" ? tarifa.valorOps : tarifa.valorBonificacion;
  const valorHora = form.valorHoraManual ? Number(form.valorHoraManual) : valorHoraSugerido;
  const total = (Number(form.horas) || 0) * valorHora;
  function cambiarTipo(t) {
    setForm({ ...form, tipo: t, valorHoraManual: "" });
  }
  function cambiarPrograma(e) {
    setForm({ ...form, programa: e.target.value, valorHoraManual: "" });
  }
  function cambiarEscalafon(e) {
    setForm({ ...form, escalafon: e.target.value, valorHoraManual: "" });
  }

  const edco = esEdco(prog);
  const valid = form.modulo && form.docente && form.horas && form.fechaInicio && form.fechaFin && (!edco || form.nombrePrograma.trim());
  const liqForm = liquidacionSS({ tipo: form.tipo, horas: Number(form.horas) || 0, valorHora, fechaInicio: form.fechaInicio, fechaFin: form.fechaFin }, config);

  function guardar() {
    const tipoCambio = editando && record.tipo !== form.tipo;
    const documentos = form.tipo === "OPS"
      ? (editando && !tipoCambio ? record.documentos : Object.fromEntries(config.documentosRequeridos.map((d) => [d, "Pendiente"])))
      : null;
    onSave({
      ...form,
      nombrePrograma: edco ? form.nombrePrograma.trim() : "",
      horas: Number(form.horas),
      valorHora: form.valorHoraManual ? Number(form.valorHoraManual) : valorHoraSugerido,
      noOPS: form.tipo === "OPS" ? (form.noOPS || `OPS-2026-${Date.now().toString().slice(-6)}`) : undefined,
      documentos,
      estado: editando ? record.estado : (form.tipo === "OPS" ? "OPS Solicitada" : "Bonificación registrada"),
      actualizador: config.usuarioActual,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(27,23,64,0.4)" }} />
      <div className="font-body" style={{ position: "relative", background: "var(--paper)", borderRadius: 16, padding: 24, width: 560, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>{editando ? "Editar registro" : "Nuevo registro"}</span>
          <div style={{ display: "flex", gap: 6 }}>
            {editando && (
              <button onClick={() => setConfirmDelete(true)} style={{ fontSize: 12, fontWeight: 600, border: "1px solid var(--brick)", color: "var(--brick)", background: "var(--brick-soft)", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>Eliminar</button>
            )}
            <button onClick={onClose} style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 999, width: 30, height: 30, cursor: "pointer" }}><X size={15} /></button>
          </div>
        </div>

        {confirmDelete && (
          <div style={{ marginBottom: 14, background: "var(--brick-soft)", border: "1px solid var(--brick)", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12.5, marginBottom: 8 }}>¿Eliminar este registro de forma permanente? Esta acción no se puede deshacer.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onDelete(record.id)} style={{ flex: 1, background: "var(--brick)", color: "#fff", border: "none", borderRadius: 7, padding: "7px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Sí, eliminar</button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, background: "var(--paper-raised)", border: "1px solid var(--line-strong)", borderRadius: 7, padding: "7px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["OPS", "BONIFICACION"].map((t) => (
            <button key={t} onClick={() => cambiarTipo(t)} style={{
              flex: 1, padding: "10px 12px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${form.tipo === t ? "var(--ink)" : "var(--line-strong)"}`,
              background: form.tipo === t ? "var(--ink)" : "var(--paper-raised)", color: form.tipo === t ? "#fff" : "var(--ink)",
            }}>{t === "OPS" ? "OPS" : "Bonificación"}</button>
          ))}
        </div>
        {form.tipo === "BONIFICACION" && (
          <div style={{ fontSize: 11.5, color: "var(--gold)", background: "var(--gold-soft)", borderRadius: 8, padding: "7px 10px", marginBottom: 14 }}>
            Las bonificaciones no requieren documentos ({config.documentosRequeridos.join(", ")}).
          </div>
        )}
        {editando && record.tipo !== form.tipo && (
          <div style={{ fontSize: 11.5, color: "var(--amber)", background: "var(--amber-soft)", borderRadius: 8, padding: "7px 10px", marginBottom: 14 }}>
            Cambiaste el tipo de vinculación: el checklist de documentos se reiniciará al guardar.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Labeled label="Programa" span2>
            <select value={form.programa} onChange={cambiarPrograma} style={inputStyle}>
              {programas.map((p) => <option key={p.sigla} value={p.sigla}>{p.sigla} — {p.nombre}</option>)}
            </select>
          </Labeled>
          <div style={{ gridColumn: "span 2", fontSize: 11.5, color: "var(--ink-soft)", marginTop: -6 }}>
            Coordinador: <b>{prog.coordinador}</b> · {prog.correo} · CC {prog.cc} · PA {prog.pa}
          </div>
          {edco && (
            <Labeled label="Nombre del programa (diplomado o curso)" span2>
              <input value={form.nombrePrograma} onChange={set("nombrePrograma")} placeholder="Ej. Diplomado en Gerencia de Proyectos" style={inputStyle} />
            </Labeled>
          )}
          {form.tipo === "OPS" && (
            <Labeled label="No. OPS" span2><input value={form.noOPS} onChange={set("noOPS")} placeholder="Se genera automáticamente si se deja vacío" style={inputStyle} /></Labeled>
          )}
          <Labeled label="Cohorte"><input value={form.cohorte} onChange={set("cohorte")} style={inputStyle} /></Labeled>
          <Labeled label="Ciclo / Semestre"><input value={form.ciclo} onChange={set("ciclo")} style={inputStyle} /></Labeled>
          <Labeled label="Módulo / materia" span2><input value={form.modulo} onChange={set("modulo")} style={inputStyle} /></Labeled>
          <Labeled label="Docente"><input value={form.docente} onChange={set("docente")} style={inputStyle} /></Labeled>
          <Labeled label="Correo"><input value={form.correo} onChange={set("correo")} style={inputStyle} /></Labeled>
          <Labeled label="Horas"><input type="number" value={form.horas} onChange={set("horas")} style={inputStyle} /></Labeled>
          <Labeled label="Escalafón / Categoría">
            <select value={form.escalafon} onChange={cambiarEscalafon} style={inputStyle}>
              {CATEGORIAS_ESCALAFON.map((e) => <option key={e}>{e}</option>)}
            </select>
          </Labeled>
          <Labeled label="Fecha inicio"><input type="date" value={form.fechaInicio} onChange={set("fechaInicio")} style={inputStyle} /></Labeled>
          <Labeled label="Fecha fin"><input type="date" value={form.fechaFin} onChange={set("fechaFin")} style={inputStyle} /></Labeled>
          <Labeled label={form.escalafon === "Otros" ? "Valor hora (escribe el valor manualmente)" : `Valor hora (${prog.tipo || "programa"} · ${form.escalafon} · ${form.tipo === "OPS" ? "OPS" : "Bonificación"}: ${COP(valorHoraSugerido)})`} span2>
            <input type="number" placeholder={form.escalafon === "Otros" ? "Escribe el valor" : String(valorHoraSugerido)} value={form.valorHoraManual} onChange={set("valorHoraManual")} style={inputStyle} />
          </Labeled>
        </div>

        <div style={{ marginTop: 14, background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Valor hora</span><b className="font-mono">{COP(valorHora)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Valor total ({form.horas || 0} h)</span><b className="font-mono">{COP(total)}</b>
          </div>
          {form.tipo === "OPS" && (
            <>
              <div style={{ height: 1, background: "var(--line)", margin: "2px 0" }} />
              {liqForm || form.fechaInicio ? <PanelSS liq={liqForm} config={config} /> : <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Indique las fechas del periodo para calcular la seguridad social.</div>}
            </>
          )}
        </div>

        <button disabled={!valid} onClick={guardar}
          style={{ marginTop: 16, width: "100%", padding: "11px 12px", borderRadius: 9, border: "none", cursor: valid ? "pointer" : "not-allowed", opacity: valid ? 1 : 0.5, background: "var(--moss)", color: "#fff", fontSize: 13.5, fontWeight: 700 }}>
          {editando ? "Guardar cambios" : "Crear registro"}
        </button>
      </div>
    </div>
  );
}
