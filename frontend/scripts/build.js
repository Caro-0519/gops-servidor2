/* Compila la interfaz con esbuild y deja solo las fuentes "latin" que se usan.
   Uso:  npm install && npm run build   →   genera site/dist/ */
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const SALIDA = path.join(__dirname, "..", "site", "dist");
fs.rmSync(SALIDA, { recursive: true, force: true });

esbuild.buildSync({
  entryPoints: [path.join(__dirname, "..", "src", "entry.jsx")],
  bundle: true,
  minify: true,
  outdir: SALIDA,
  loader: { ".jsx": "jsx", ".woff2": "file", ".woff": "file" },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});

// Poda de fuentes: se conservan solo las variantes latin en woff2 (menos archivos y menos peso)
const archivoCss = path.join(SALIDA, "entry.css");
let css = fs.readFileSync(archivoCss, "utf8");
for (const bloque of css.match(/@font-face\{[^}]*\}/g) || []) {
  const urls = bloque.match(/url\(([^)]*)\)/g) || [];
  const esLatin = urls.some((u) => u.includes("-latin-") && !u.includes("latin-ext"));
  css = css.replace(bloque, esLatin ? bloque.replace(/,?\s*url\([^)]*\.woff"?\)\s*format\("woff"\)/g, "") : "");
}
fs.writeFileSync(archivoCss, css);
const usados = new Set([...css.matchAll(/url\(["']?([^)"']*\.woff2?)["']?\)/g)].map((m) => path.basename(m[1])));
for (const f of fs.readdirSync(SALIDA)) {
  if (/\.woff2?$/.test(f) && !usados.has(f)) fs.unlinkSync(path.join(SALIDA, f));
}
console.log("Listo:", fs.readdirSync(SALIDA).join(", "));
