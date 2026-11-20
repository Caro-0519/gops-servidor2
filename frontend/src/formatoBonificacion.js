/* Genera el formato oficial de bonificación (PA.GH.F40) ya diligenciado.
   Se parte de la plantilla original (con logo y formato) y solo se escriben los valores en sus celdas. */
import JSZip from "jszip";
import PLANTILLA from "./formatoBonificacionPlantilla.js";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const colNum = (ref) => ref.replace(/\d+/g, "").split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export function fechaLarga(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${parseInt(m[3], 10)} de ${MESES[parseInt(m[2], 10) - 1]} de ${m[1]}` : "";
}

// Escribe un valor en una celda conservando su estilo (s="..."). Si la celda no existe, la crea en su fila en orden.
export function ponerCelda(xml, ref, valor, estiloPorDefecto) {
  const esNum = typeof valor === "number";
  const armar = (estilo) => {
    const s = estilo != null ? ` s="${estilo}"` : "";
    if (valor === "" || valor == null) return `<c r="${ref}"${s}/>`;
    return esNum ? `<c r="${ref}"${s}><v>${valor}</v></c>` : `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(valor)}</t></is></c>`;
  };
  const re = new RegExp(`<c r="${ref}"((?:\\s[^>]*?)?)(?:/>|>(?:(?!</c>)[\\s\\S])*</c>)`);
  const m = re.exec(xml);
  if (m) {
    const est = /\ss="(\d+)"/.exec(m[1]);
    return xml.replace(re, () => armar(est ? est[1] : estiloPorDefecto));
  }
  const fila = ref.replace(/[A-Z]+/, "");
  const reFila = new RegExp(`(<row r="${fila}"[^>]*?)(/>|>([\\s\\S]*?)</row>)`);
  const f = reFila.exec(xml);
  if (!f) throw new Error("La plantilla no tiene la fila " + fila);
  const celdas = f[2] === "/>" ? [] : (f[3].match(/<c r="[A-Z]+\d+"(?:\s[^>]*?)?(?:\/>|>(?:(?!<\/c>)[\s\S])*<\/c>)/g) || []);
  const nueva = armar(estiloPorDefecto);
  let puesta = false; const out = [];
  for (const c of celdas) {
    const r = /r="([A-Z]+\d+)"/.exec(c)[1];
    if (!puesta && colNum(r) > colNum(ref)) { out.push(nueva); puesta = true; }
    out.push(c);
  }
  if (!puesta) out.push(nueva);
  return xml.replace(reFila, () => `${f[1]}>${out.join("")}</row>`);
}

/* datos: { nombre, identificacion, cargo, dedicacion ("TC"|"MT"|"HC"|"ADTVO"), programa, unidad, centroCostos,
            modulo, horas, valorHora, fechaInicio, fechaFin, observaciones } */
export async function generarFormatoBonificacion(datos) {
  const zip = await JSZip.loadAsync(PLANTILLA, { base64: true });
  const ruta = "xl/worksheets/sheet1.xml";
  let x = await zip.file(ruta).async("string");
  const horas = Number(datos.horas) || 0, vh = Number(datos.valorHora) || 0;
  x = ponerCelda(x, "D8", datos.nombre || "");
  x = ponerCelda(x, "D9", datos.identificacion || "");
  x = ponerCelda(x, "D10", datos.cargo || "");
  const marca = { TC: "E11", MT: "G11", HC: "I11", ADTVO: "K11" };
  for (const [k, ref] of Object.entries(marca)) x = ponerCelda(x, ref, k === datos.dedicacion ? "X" : "");
  x = ponerCelda(x, "D13", datos.programa || "");
  x = ponerCelda(x, "D14", datos.unidad || "");
  x = ponerCelda(x, "D15", datos.centroCostos || "");
  x = ponerCelda(x, "D16", datos.modulo || "");
  x = ponerCelda(x, "E17", horas);
  x = ponerCelda(x, "K17", vh);
  // D18 es fórmula (=E17*K17): se actualiza el valor guardado para que se vea aun sin recalcular
  x = x.replace(/(<c r="D18"[^>]*><f>[^<]*<\/f>)<v>[^<]*<\/v>/, `$1<v>${horas * vh}</v>`);
  const fechas = datos.fechaInicio && datos.fechaFin ? `Del ${fechaLarga(datos.fechaInicio)} al ${fechaLarga(datos.fechaFin)}` : "";
  for (const col of "DEFGHIJK") x = ponerCelda(x, col + "19", col === "D" ? fechas : "", 32);
  if (!/<mergeCell ref="D19:K19"\/>/.test(x)) {
    x = x.replace(/<mergeCells count="(\d+)">/, (_, n) => `<mergeCells count="${+n + 1}">`).replace("</mergeCells>", '<mergeCell ref="D19:K19"/></mergeCells>');
  }
  x = ponerCelda(x, "A21", datos.observaciones || "");
  x = ponerCelda(x, "K26", datos.nombre || "");
  zip.file(ruta, x);
  // Que Excel recalcule al abrir
  const wbRuta = "xl/workbook.xml";
  let wb = await zip.file(wbRuta).async("string");
  wb = /<calcPr[^>]*\/>/.test(wb) ? wb.replace(/<calcPr([^>]*?)\/>/, (m, a) => (/fullCalcOnLoad/.test(a) ? m : `<calcPr${a} fullCalcOnLoad="1"/>`)) : wb.replace("</workbook>", '<calcPr fullCalcOnLoad="1"/></workbook>');
  zip.file(wbRuta, wb);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", compression: "DEFLATE" });
}
