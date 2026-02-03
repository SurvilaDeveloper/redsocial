//src/components/search/SearchEmptyState.tsx
"use client";
import type { Mode } from "./types";

export default function SearchEmptyState({ q, mode }: { q: string; mode: Mode }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            <div className="text-slate-100 font-medium">No encontramos resultados</div>

            <div className="mt-2 text-slate-400">
                Búsqueda: <span className="text-slate-200">"{q}"</span> · filtro{" "}
                <span className="text-slate-200">{mode}</span>
            </div>

            <ul className="mt-3 list-disc pl-5 text-slate-400 space-y-1">
                <li>Probá con menos palabras o una palabra clave (ej: “react”, “docencia”).</li>
                <li>Si estás en “skills” o “projects”, probá “cvcontent”.</li>
                <li>Probá buscar por nick o por ciudad.</li>
            </ul>
        </div>
    );
}
