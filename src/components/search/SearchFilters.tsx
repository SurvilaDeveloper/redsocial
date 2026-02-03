// src/components/search/SearchFilters.tsx
"use client";

import type { Mode } from "./types";
import { SEARCH_MODES } from "./types";

export default function SearchFilters(props: {
    q: string;
    onQChange: (v: string) => void;
    mode: Mode;
    onModeChange: (v: Mode) => void;
    onlyWithCV: boolean;
    onOnlyWithCVChange: (v: boolean) => void;
    loading: boolean;
}) {
    const { q, onQChange, mode, onModeChange, onlyWithCV, onOnlyWithCVChange, loading } = props;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-3">
            <input
                value={q}
                onChange={(e) => onQChange(e.target.value)}
                placeholder="Buscar usuarios…"
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-slate-600"
            />

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="flex gap-2 items-center">
                    <label className="text-xs text-slate-400">Filtro:</label>

                    <select
                        value={mode}
                        onChange={(e) => onModeChange(e.target.value as Mode)}
                        className="rounded-xl bg-slate-900 border border-slate-800 px-2 py-2 text-sm text-slate-100"
                    >
                        <option value="all">Todo</option>
                        <option value="name">Nombre</option>
                        <option value="nick">Nick</option>
                        <option value="location">Ubicación</option>
                        <option value="occupation">Ocupación</option>
                        <option value="company">Empresa</option>
                        <option value="social">Redes</option>
                        <option value="cv">CV (título/resumen)</option>
                        <option value="cvcontent">CV (contenido completo)</option>
                        <option value="skills">Skills (desde CV)</option>
                        <option value="projects">Proyectos (desde CV)</option>
                    </select>

                    <label className="text-sm text-slate-300 ml-2 flex gap-2 items-center">
                        <input
                            type="checkbox"
                            checked={onlyWithCV}
                            onChange={(e) => onOnlyWithCVChange(e.target.checked)}
                            className="accent-slate-200"
                        />
                        Solo con CV público
                    </label>
                </div>

                <div className="text-xs text-slate-500">{loading ? "Buscando…" : " "}</div>
            </div>
        </div>
    );
}

