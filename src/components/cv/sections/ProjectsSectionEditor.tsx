// src/components/cv/sections/ProjectsSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
} from "@/components/cv/styles/editorStyles";

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

    const isResettingRef = useRef(false);

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

    useEffect(() => {
        const sub = watch((values) => {
            if (isResettingRef.current) return;

            const next: ProjectData[] = (values.projects ?? []).map((p) => ({
                id: p?.id ?? crypto.randomUUID(),
                name: p?.name ?? "",
                // ✅ NO normalizar description: si usás normalizeOptional, probablemente estás "trimmeando"
                // y te come espacios mientras tipeás (especialmente con mode: "onChange").
                description: (p as any)?.description ?? "",
                url: normalizeOptional((p as any)?.url ?? ""),
                startDate: normalizeOptional((p as any)?.startDate ?? ""),
                endDate: normalizeOptional((p as any)?.endDate ?? ""),
            }));

            onChange(next);
        });

        return () => sub.unsubscribe();
    }, [watch, onChange]);

    const addProject = () => append(createProject());

    const ids = (watch("projects") ?? []).map((it, idx) =>
        String(it?.id ?? fields[idx]?.id)
    );

    const hasAny = fields.length > 0;
    const hasErrors = Object.keys(formState.errors ?? {}).length > 0;

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

                <Button
                    type="button"
                    onClick={addProject}
                    className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-50"
                >
                    + Agregar
                </Button>
            </div>

            {/* List */}
            <SortableList
                ids={ids}
                onMove={(from, to) => {
                    move(from, to);
                }}
            >
                <div className="space-y-3">
                    {fields.map((field, index) => {
                        const p = watch("projects")?.[index];
                        const projectId = String((p?.id ?? field.id) as any);

                        const title = p?.name?.trim() ? p.name : `Proyecto ${index + 1}`;

                        return (
                            <SortableRow
                                key={projectId}
                                density="compact"
                                id={projectId}
                                title={
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-100">
                                            {title}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            (arrastrá para reordenar)
                                        </span>
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
                                            className={cvEditorStyles.input}
                                        />
                                    </div>

                                    {/* Descripción */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Descripción</Label>
                                        <Textarea
                                            {...register(`projects.${index}.description` as const)}
                                            placeholder="Qué hiciste, con qué tecnologías, impacto..."
                                            className={cvEditorStyles.textarea}
                                        />
                                    </div>

                                    {/* URL */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>URL</Label>
                                        <Input
                                            {...register(`projects.${index}.url` as const, {
                                                setValueAs: normalizeOptional,
                                            })}
                                            placeholder="https://... (opcional)"
                                            className={cvEditorStyles.input}
                                        />
                                        <p className="text-xs text-slate-500">
                                            Link a GitHub, demo o página del proyecto.
                                        </p>
                                    </div>

                                    {/* Fechas (schema: YYYY-MM) */}
                                    <div className={cvEditorStyles.grid2}>
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Inicio</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                placeholder="YYYY-MM (ej: 2024-07)"
                                                {...register(`projects.${index}.startDate` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            <p className="text-[11px] text-slate-500">
                                                Formato: <span className="font-medium">YYYY-MM</span>
                                            </p>
                                        </div>

                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Fin</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                placeholder="YYYY-MM (o vacío si está activo)"
                                                {...register(`projects.${index}.endDate` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            <p className="text-[11px] text-slate-500">
                                                Si sigue activo, dejalo vacío.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {!hasAny && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                            No hay proyectos todavía. Tocá{" "}
                            <span className="font-medium">“+ Agregar”</span>.
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
                    className="h-9 px-3 text-xs border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                >
                    + Agregar proyecto
                </Button>

                {hasErrors && (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                        Hay errores en la sección de proyectos.
                    </div>
                )}
            </div>
        </div>
    );
}

