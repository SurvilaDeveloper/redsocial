//src/components/cv/TagsEditor.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CVContent } from "@/types/cv";
import { cvEditorStyles } from "@/components/cv/styles/editorStyles";
import { X } from "lucide-react";
import { normalizeKeyword } from "@/lib/productive/normalize";

type StoredTag = { k: "tag"; t: string; o: string };

// sugerencias “limpias” desde CV, conservando el original de los campos
function extractSuggestionsFromCv(content: CVContent): string[] {
    const out: string[] = [];

    for (const sec of content?.sections ?? []) {
        if (!sec) continue;

        if (sec.type === "profile" && sec.data && typeof sec.data === "object") {
            const headline = (sec.data as any)?.headline;
            if (typeof headline === "string" && headline.trim()) out.push(headline.trim());
        }

        if (sec.type === "skills" && Array.isArray(sec.data)) {
            for (const sk of sec.data as any[]) {
                const name = sk?.name;
                if (typeof name === "string" && name.trim()) out.push(name.trim());
            }
        }

        if (sec.type === "experience" && Array.isArray(sec.data)) {
            for (const ex of sec.data as any[]) {
                if (typeof ex?.role === "string" && ex.role.trim()) out.push(ex.role.trim());
                if (typeof ex?.company === "string" && ex.company.trim()) out.push(ex.company.trim());
            }
        }

        if (sec.type === "education" && Array.isArray(sec.data)) {
            for (const ed of sec.data as any[]) {
                if (typeof ed?.degree === "string" && ed.degree.trim()) out.push(ed.degree.trim());
                if (typeof ed?.institution === "string" && ed.institution.trim()) out.push(ed.institution.trim());
            }
        }

        if (sec.type === "projects" && Array.isArray(sec.data)) {
            for (const p of sec.data as any[]) {
                if (typeof p?.name === "string" && p.name.trim()) out.push(p.name.trim());
            }
        }

        if (sec.type === "custom" && sec.data && typeof sec.data === "object") {
            const title = (sec.data as any)?.title;
            if (typeof title === "string" && title.trim()) out.push(title.trim());
            const items = (sec.data as any)?.items;
            if (Array.isArray(items)) {
                for (const it of items) {
                    if (typeof it?.title === "string" && it.title.trim()) out.push(it.title.trim());
                }
            }
        }
    }

    // dedupe por normalizada, pero mostrar “original”
    const seen = new Set<string>();
    const uniq: string[] = [];

    for (const o of out) {
        const t = normalizeKeyword(o);
        if (!t) continue;
        if (seen.has(t)) continue;
        seen.add(t);
        uniq.push(o);
    }

    return uniq.slice(0, 60);
}

export function TagsEditor({ content }: { content: CVContent }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [selected, setSelected] = useState<StoredTag[]>([]);
    const [draft, setDraft] = useState("");

    const suggestions = useMemo(() => extractSuggestionsFromCv(content), [content]);

    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/productive/tags", { method: "GET" });
                const json = await res.json();
                if (!alive) return;

                const tags = Array.isArray(json?.tags) ? (json.tags as StoredTag[]) : [];
                setSelected(tags);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const selectedKeySet = useMemo(() => new Set(selected.map((x) => x.t)), [selected]);

    const addTag = (raw: string) => {
        const o = raw.trim();
        const t = normalizeKeyword(o);
        if (!t) return;

        setSelected((prev) => {
            if (prev.some((x) => x.t === t)) return prev;
            return [...prev, { k: "tag", t, o }];
        });
    };

    const removeTag = (t: string) => {
        setSelected((prev) => prev.filter((x) => x.t !== t));
    };

    const onDraftKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (draft.trim()) {
                addTag(draft);
                setDraft("");
            }
        }
        if (e.key === "Backspace" && !draft.trim() && selected.length) {
            // UX: backspace con input vacío -> borra último chip
            removeTag(selected[selected.length - 1].t);
        }
    };

    const saveTags = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/productive/tags", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: selected.map((x) => x.o) }),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(json?.error ?? "Error guardando tags");
            }

            // ✅ sincroniza UI con el canonical ensure: dedupe/trim/normalize backend
            if (Array.isArray(json?.tags)) {
                setSelected(json.tags as StoredTag[]);
            }
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-100">Tags (para búsqueda)</h3>
                    <p className="text-xs text-slate-400">
                        Estas tags <span className="font-medium">no se muestran</span> en tu CV. Sirven para mejorar el match con empresas y recluters.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={saveTags}
                    disabled={loading || saving}
                    className={cn(
                        "h-9 px-3 rounded-md text-xs font-medium",
                        saving ? "bg-slate-800 text-slate-300" : "bg-emerald-600 hover:bg-emerald-500 text-slate-50"
                    )}
                >
                    {saving ? "Guardando…" : "Guardar tags"}
                </Button>
            </div>

            {/* Selected chips + input */}
            <div className={cvEditorStyles.block}>
                <Label className={cvEditorStyles.label}>Tus tags</Label>

                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {selected.map((tag) => (
                            <button
                                key={tag.t}
                                type="button"
                                onClick={() => removeTag(tag.t)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/40 px-2 py-1 text-xs text-slate-100 hover:bg-slate-900"
                                title="Quitar tag"
                            >
                                <span>{tag.o}</span>
                                <X className="h-3.5 w-3.5 opacity-70" />
                            </button>
                        ))}

                        <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={onDraftKeyDown}
                            placeholder={loading ? "Cargando…" : "Escribí una tag y presioná Enter"}
                            className="min-w-[180px] flex-1 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
                            disabled={loading}
                        />
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500">
                        Tip: Enter o coma para agregar. Backspace con el input vacío elimina la última.
                    </p>
                </div>
            </div>

            {/* Suggestions */}
            <div className={cvEditorStyles.block}>
                <Label className={cvEditorStyles.label}>Sugerencias del CV</Label>

                <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => {
                        const t = normalizeKeyword(s);
                        const active = selectedKeySet.has(t);

                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => (active ? removeTag(t) : addTag(s))}
                                className={cn(
                                    "rounded-full border px-2 py-1 text-xs transition",
                                    active
                                        ? "border-emerald-500/60 bg-emerald-900/20 text-emerald-100"
                                        : "border-slate-800 bg-slate-950/40 text-slate-200 hover:bg-slate-900/40"
                                )}
                                title={active ? "Quitar" : "Agregar"}
                            >
                                {s}
                            </button>
                        );
                    })}

                    {!suggestions.length && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                            Todavía no hay suficientes datos en el CV para sugerencias.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
