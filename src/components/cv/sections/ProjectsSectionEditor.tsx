// src/components/cv/sections/ProjectsSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { projectsSectionSchema } from "@/lib/zod/cv";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ProjectData } from "@/types/cv";

import { SortableList } from "@/components/cv/dnd/SortableList";
import { SortableRow } from "@/components/cv/dnd/SortableRow";

import {
    cvEditorStyles,
    normalizeOptional,
    normalizeOptionalSoft,
} from "@/components/cv/styles/editorStyles";

import { cn } from "@/lib/utils";

type ProjectsSectionEditorProps = {
    value: ProjectData[];
    onChange: (value: ProjectData[]) => void;
};

type FormValues = {
    projects: ProjectData[];
};

const createProject = (): ProjectData => ({
    id: crypto.randomUUID(),
    name: "",
    description: "",
    url: undefined,
    startDate: undefined,
    endDate: undefined,
});

// UI helper: texto de error consistente
function ErrorText({ error }: { error?: FieldError }) {
    if (!error?.message) return null;
    return <p className="mt-1 text-[11px] text-red-300">{String(error.message)}</p>;
}

// Detecta duplicados por nombre (trim + lower), y devuelve el índice del ÚLTIMO duplicado.
function getLastDuplicateProjectIndex(projects: ProjectData[]): number | null {
    const seen = new Map<string, number>();
    let lastDup: number | null = null;

    for (let i = 0; i < projects.length; i++) {
        const name = (projects[i]?.name ?? "").trim().toLowerCase();
        if (!name) continue;

        if (seen.has(name)) lastDup = i;
        else seen.set(name, i);
    }

    return lastDup;
}

export function ProjectsSectionEditor({ value, onChange }: ProjectsSectionEditorProps) {
    const defaultValues = useMemo<FormValues>(() => {
        return { projects: Array.isArray(value) ? value : [] };
    }, [value]);

    const form = useForm<FormValues>({
        resolver: zodResolver(z.object({ projects: projectsSectionSchema })),
        defaultValues,
        mode: "onChange",
        shouldUnregister: false,
    });

    const { control, register, watch, reset, formState } = form;

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "projects",
    });

    // ✅ Flag anti-loop: cuando hacemos reset, no propagamos watch->onChange
    const isResettingRef = useRef(false);

    // ✅ externo -> form (SOLO cuando cambia value)
    useEffect(() => {
        isResettingRef.current = true;

        reset(defaultValues, {
            keepDirty: false,
            keepTouched: false,
        });

        queueMicrotask(() => {
            isResettingRef.current = false;
        });
    }, [defaultValues, reset]);

    // ✅ form -> externo (NO bloqueamos por schema para preview reactivo)
    useEffect(() => {
        const sub = watch((values) => {
            if (isResettingRef.current) return;

            const next: ProjectData[] = (values.projects ?? []).map((p) => ({
                id: p?.id ?? crypto.randomUUID(),
                name: (p?.name ?? "") as any,
                description: (normalizeOptionalSoft(((p as any)?.description ?? "") as string) ?? "") as any,
                url: normalizeOptional((p as any)?.url ?? ""),
                startDate: normalizeOptional((p as any)?.startDate ?? ""),
                endDate: normalizeOptional((p as any)?.endDate ?? ""),
            }));

            onChange(next);
        });

        return () => sub.unsubscribe();
    }, [watch, onChange]);

    /* =================== MAX + Errors pro + Add =================== */

    const MAX_PROJECTS = 10;

    const projects = (watch("projects") ?? []) as ProjectData[];
    const projectsCount = projects.length ?? fields.length;

    const reachedMax = projectsCount >= MAX_PROJECTS;

    // Duplicados (proactivo)
    const lastDupIndex = getLastDuplicateProjectIndex(projects);
    const hasDuplicate = lastDupIndex !== null;

    // Safety net: error a nivel array (max / root)
    const projectsArrayError =
        (formState.errors as any)?.projects?.message ??
        (formState.errors as any)?.projects?.root?.message ??
        undefined;

    /**
     * ✅ “Idiomas pro”: no permitir agregar si hay CUALQUIER error crítico
     * - formState.isValid ya contempla todo el schema (incluye fechas/url/name/duplicados)
     * - además miramos projectsArrayError por si queda algo en root
     */
    const hasCriticalErrors = !formState.isValid || Boolean(projectsArrayError);

    /**
     * Botón se bloquea si:
     * - max
     * - duplicados
     * - o cualquier error crítico (isValid false)
     */
    const addDisabled = reachedMax || hasDuplicate || hasCriticalErrors;

    const addProject = () => {
        if (addDisabled) return;
        append(createProject());
    };

    /* =================== DnD =================== */

    const ids = (projects ?? []).map((it, idx) => String(it?.id ?? fields[idx]?.id));
    const hasAny = (projectsCount ?? 0) > 0;

    /* =================== Errors helpers =================== */

    const itemErrors = formState.errors?.projects;
    const fieldError = (idx: number, key: keyof ProjectData) => {
        const row = itemErrors?.[idx] as Partial<Record<keyof ProjectData, FieldError>> | undefined;
        return row?.[key];
    };

    const inputErrorClass = "border-red-500/60 focus-visible:ring-red-500/30";

    // Mensaje del botón (prioridad: max > duplicados > críticos)
    const addHint = reachedMax
        ? `Has alcanzado el límite de proyectos (${MAX_PROJECTS}). Podés usar una sección personalizada si necesitás extenderte.`
        : hasDuplicate
            ? "Hay nombres de proyectos repetidos. Corregí el último repetido para poder agregar otro."
            : hasCriticalErrors
                ? "Hay errores en proyectos. Corregilos para poder agregar uno nuevo."
                : null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-100">Proyectos</h3>
                    <p className="text-xs text-slate-400">
                        Mostrá proyectos relevantes. Podés reordenarlos arrastrando.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <Button
                        type="button"
                        onClick={addProject}
                        disabled={addDisabled}
                        className={cn(
                            "h-9 px-3 rounded-md text-xs font-medium",
                            addDisabled
                                ? "bg-slate-800 text-slate-400 cursor-not-allowed opacity-70"
                                : "bg-emerald-600 hover:bg-emerald-500 text-slate-50"
                        )}
                    >
                        + Agregar
                    </Button>

                    {addHint && (
                        <p className="max-w-[260px] text-[11px] leading-snug text-slate-400 text-right">
                            {addHint}
                        </p>
                    )}
                </div>
            </div>

            {/* Array error (safety net) */}
            {projectsArrayError && !reachedMax && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                    {String(projectsArrayError)}
                </div>
            )}

            {/* List */}
            <SortableList
                ids={ids}
                onMove={(from, to) => {
                    move(from, to);
                }}
            >
                <div className="space-y-3">
                    {fields.map((field, index) => {
                        const p = projects?.[index];
                        const projectId = String((p?.id ?? field.id) as any);

                        const title = p?.name?.trim() ? p.name : `Proyecto ${index + 1}`;

                        // errors
                        const eName = fieldError(index, "name");
                        const eDescription = fieldError(index, "description");
                        const eUrl = fieldError(index, "url");
                        const eStartDate = fieldError(index, "startDate");
                        const eEndDate = fieldError(index, "endDate");

                        return (
                            <SortableRow
                                key={projectId}
                                density="compact"
                                id={projectId}
                                title={
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-100">{title}</span>
                                        <span className="text-[11px] text-slate-400">(arrastrá para reordenar)</span>
                                    </div>
                                }
                                headerRight={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => remove(index)}
                                        className="h-8 px-2 text-xs border-red-500/50 text-red-200 bg-red-950/30 hover:bg-red-900/40 hover:text-red-100"
                                    >
                                        Eliminar
                                    </Button>
                                }
                            >
                                <div className="space-y-4">
                                    {/* Nombre */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Nombre</Label>
                                        <Input
                                            {...register(`projects.${index}.name` as const)}
                                            placeholder="Ej: Dashboard de movilidad (Subte)"
                                            className={cn(cvEditorStyles.input, eName && inputErrorClass)}
                                        />
                                        <ErrorText error={eName} />
                                    </div>

                                    {/* Descripción */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Descripción</Label>
                                        <Textarea
                                            {...register(`projects.${index}.description` as const, {
                                                setValueAs: (v) =>
                                                    normalizeOptionalSoft(typeof v === "string" ? v : "") ?? "",
                                            })}
                                            placeholder="Qué hiciste, con qué tecnologías, impacto..."
                                            className={cn(cvEditorStyles.textarea, eDescription && inputErrorClass)}
                                        />
                                        <ErrorText error={eDescription} />
                                    </div>

                                    {/* URL */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>URL</Label>
                                        <Input
                                            {...register(`projects.${index}.url` as const, {
                                                setValueAs: normalizeOptional,
                                            })}
                                            placeholder="https://... (opcional)"
                                            className={cn(cvEditorStyles.input, eUrl && inputErrorClass)}
                                        />
                                        <p className="text-xs text-slate-500">Link a GitHub, demo o página del proyecto.</p>
                                        <ErrorText error={eUrl} />
                                    </div>

                                    {/* Fechas */}
                                    <div className={cvEditorStyles.grid2}>
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Inicio</Label>
                                            <Input
                                                className={cn(cvEditorStyles.input, eStartDate && inputErrorClass)}
                                                placeholder="YYYY-MM (ej: 2024-07)"
                                                {...register(`projects.${index}.startDate` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            {eStartDate ? (
                                                <ErrorText error={eStartDate} />
                                            ) : (
                                                <p className="text-[11px] text-slate-500">
                                                    Formato: <span className="font-medium">YYYY-MM</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Fin</Label>
                                            <Input
                                                className={cn(cvEditorStyles.input, eEndDate && inputErrorClass)}
                                                placeholder="YYYY-MM (o vacío si está activo)"
                                                {...register(`projects.${index}.endDate` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            {eEndDate ? (
                                                <ErrorText error={eEndDate} />
                                            ) : (
                                                <p className="text-[11px] text-slate-500">Si sigue activo, dejalo vacío.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {!hasAny && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                            No hay proyectos todavía. Tocá <span className="font-medium">“+ Agregar”</span>.
                        </div>
                    )}
                </div>
            </SortableList>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800/70 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={addProject}
                    disabled={addDisabled}
                    className={cn(
                        "h-9 px-3 text-xs",
                        addDisabled
                            ? "border-slate-700 text-slate-500 bg-slate-900/20 cursor-not-allowed opacity-70"
                            : "border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                    )}
                >
                    + Agregar proyecto
                </Button>

                {addHint && <p className="text-[11px] text-slate-400">{addHint}</p>}
            </div>
        </div>
    );
}