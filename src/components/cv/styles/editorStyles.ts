// src/components/cv/styles/editorStyles.ts

export const cvEditorStyles = {
    // labels “premium” como venís usando
    label:
        "text-xs text-slate-400",

    // inputs compactos, dark, sin glow exagerado
    input:
        "h-9 w-full rounded-md bg-slate-950 border border-slate-700 " +
        "text-slate-100 px-3 text-sm placeholder:text-slate-500 " +
        "focus:outline-none focus:ring-2 focus:ring-slate-700/50",

    // textarea consistente
    textarea:
        "min-h-[84px] w-full rounded-md bg-slate-950 border border-slate-700 " +
        "text-slate-100 px-3 py-2 text-sm placeholder:text-slate-500 " +
        "focus:outline-none focus:ring-2 focus:ring-slate-700/50",

    // contenedor de bloque/celda
    block:
        "space-y-1",

    // grid fechas (y similares)
    grid2:
        "grid grid-cols-1 lg:grid-cols-2 gap-2",
};

// util para normalizar opcionales (ideal para endDate / url / etc.)
export const normalizeOptional = (v: string) => (v?.trim() ? v.trim() : undefined);

// Mantiene lo que el usuario escribe (incluye espacios internos y el espacio final mientras tipea).
// Solo convierte "" o "   " en undefined.
export const normalizeOptionalSoft = (v: string) => {
    if (typeof v !== "string") return undefined;
    return v.length === 0 || v.replace(/\s/g, "").length === 0 ? undefined : v;
};
