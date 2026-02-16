import fs from "node:fs";
import path from "node:path";

const roots = [
    path.join(process.cwd(), "src", "app"),
    path.join(process.cwd(), "app"),       // por si existe también
    path.join(process.cwd(), "src", "pages"),
    path.join(process.cwd(), "pages"),     // por si existe también
].filter(p => fs.existsSync(p));

const ROUTE_FILE_RE = /(page|route|layout)\.(tsx|ts|jsx|js)$/;

function* walkFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (e.name === "node_modules" || e.name === ".next") continue;
            yield* walkFiles(full);
        } else {
            yield full;
        }
    }
}

function normalizeSegments(relDir) {
    // reemplaza [id], [slug], [...x], [[...x]] por []
    return relDir.replace(/\[\[?\.\.\.[^\]]+\]?\]|\[[^\]]+\]/g, "[]");
}

function getDynamicNames(relDir) {
    // extrae nombres de params dinámicos en orden
    const names = [];
    const re = /\[\[?\.\.\.([^\]]+)\]?\]|\[([^\]]+)\]/g;
    let m;
    while ((m = re.exec(relDir))) {
        names.push(m[1] || m[2]);
    }
    return names;
}

const seen = new Map(); // normalizedPath -> list of { root, relDir, dynNames, file }

for (const root of roots) {
    for (const file of walkFiles(root)) {
        const base = path.basename(file);
        if (!ROUTE_FILE_RE.test(base)) continue;

        const relDir = path.relative(root, path.dirname(file)).replaceAll("\\", "/");
        const norm = normalizeSegments(relDir);

        const arr = seen.get(norm) ?? [];
        arr.push({
            root: root.replace(process.cwd(), ""),
            relDir,
            dynNames: getDynamicNames(relDir),
            file: file.replace(process.cwd(), ""),
        });
        seen.set(norm, arr);
    }
}

let found = false;

for (const [norm, arr] of seen.entries()) {
    if (arr.length <= 1) continue;

    // conflicto si difieren los nombres de params dinámicos en misma posición
    const sigs = new Set(arr.map(x => x.dynNames.join("|")));
    if (sigs.size > 1) {
        found = true;
        console.log("\n❌ CONFLICT:", norm);
        for (const x of arr) {
            console.log(`   - ${x.relDir}   (${x.dynNames.join(",") || "no-dyn"})`);
            console.log(`     file: ${x.file}`);
        }
    }
}

if (!found) {
    console.log("✅ No route param-name conflicts found.");
} else {
    console.log("\n👉 Solución: unificar el nombre del param (ej: usar siempre [slug] o siempre [id]) en esas rutas.");
}


