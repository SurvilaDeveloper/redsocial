// src/components/cv/sections/EducationSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { CVSection, EducationItem } from "@/types/cv";
import { educationSectionSchema } from "@/lib/zod/cv";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { SortableList } from "@/components/cv/dnd/SortableList";
import { SortableRow } from "@/components/cv/dnd/SortableRow";

import {
    cvEditorStyles,
    normalizeOptional,
} from "@/components/cv/styles/editorStyles";

type Props = {
    section: CVSection<"education">; // data: EducationItem[]
    onChange: (section: CVSection<"education">) => void;
};

type FormValues = {
    education: EducationItem[];
};

const createEdu = (): EducationItem => ({
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    startDate: "", // requerido por schema: YYYY-MM (pero durante edición puede estar vacío)
    endDate: undefined, // ✅ opcional real
    description: "",
});

export function EducationSectionEditor({ section, onChange }: Props) {
    const defaultValues = useMemo<FormValues>(() => {
        return {
            education: Array.isArray(section.data) ? section.data : [],
        };
    }, [section.id]);

    const form = useForm<FormValues>({
        resolver: zodResolver(z.object({ education: educationSectionSchema })),
        defaultValues,
        mode: "onChange",
        shouldUnregister: false,
    });

    const { control, register, watch, reset, formState } = form;

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "education",
    });

    // ✅ Flag anti-loop: cuando hacemos reset, no propagamos watch->onChange
    const isResettingRef = useRef(false);

    // ✅ externo -> form (SOLO cuando cambia la sección)
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

    // ✅ form -> externo (NO bloqueamos por schema para que el preview sea siempre reactivo)
    useEffect(() => {
        const sub = watch((values) => {
            if (isResettingRef.current) return;

            const next: EducationItem[] = (values.education ?? []).map((it) => ({
                id: it?.id ?? crypto.randomUUID(),
                institution: it?.institution ?? "",
                degree: it?.degree ?? "",
                startDate: it?.startDate ?? "",
                endDate: normalizeOptional((it as any)?.endDate ?? ""),
                description: it?.description ?? "",
            }));

            onChange({
                ...section,
                data: next,
            });
        });

        return () => sub.unsubscribe();
    }, [watch, onChange, section]);

    const addEducation = () => append(createEdu());

    // ids para dnd (preferimos el id real del item)
    const ids = (watch("education") ?? []).map((it, idx) =>
        String(it?.id ?? fields[idx]?.id)
    );

    const hasErrors = Object.keys(formState.errors ?? {}).length > 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-100">Educación</h3>
                    <p className="text-xs text-slate-400">
                        Agregá tu formación y ordenala arrastrando.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={addEducation}
                    className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-50"
                >
                    + Agregar
                </Button>
            </div>

            {/* List */}
            <SortableList ids={ids} onMove={(from, to) => move(from, to)}>
                <div className="space-y-3">
                    {fields.map((f, idx) => {
                        const id = String((watch("education")?.[idx]?.id ?? f.id) as any);

                        return (
                            <SortableRow
                                density="compact"
                                key={id}
                                id={id}
                                title={
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-100">
                                            Educación {idx + 1}
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
                                        className="h-8 px-2 text-xs border-red-500/50 text-red-200 bg-red-950/30 hover:bg-red-900/40 hover:text-red-100"
                                        onClick={() => remove(idx)}
                                    >
                                        Eliminar
                                    </Button>
                                }
                            >
                                <div className="space-y-4">
                                    {/* Institución */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Institución</Label>
                                        <Input
                                            className={cvEditorStyles.input}
                                            placeholder="Ej: Universidad de Buenos Aires"
                                            {...register(`education.${idx}.institution` as const)}
                                        />
                                        <p className="text-xs text-slate-500">
                                            Nombre de la institución o academia.
                                        </p>
                                    </div>

                                    {/* Título */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Título / Carrera</Label>
                                        <Input
                                            className={cvEditorStyles.input}
                                            placeholder="Ej: Licenciatura en Sistemas"
                                            {...register(`education.${idx}.degree` as const)}
                                        />
                                    </div>

                                    {/* Fechas (schema: YYYY-MM) */}
                                    <div className={cvEditorStyles.grid2}>
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Inicio</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                placeholder="YYYY-MM (ej: 2022-01)"
                                                {...register(`education.${idx}.startDate` as const)}
                                            />
                                            <p className="text-[11px] text-slate-500">
                                                Formato: <span className="font-medium">YYYY-MM</span>
                                            </p>
                                        </div>

                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Fin</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                placeholder="YYYY-MM (o vacío si está en curso)"
                                                {...register(`education.${idx}.endDate` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            <p className="text-[11px] text-slate-500">
                                                Dejá vacío si está en curso.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Descripción</Label>
                                        <Textarea
                                            className={cvEditorStyles.textarea}
                                            placeholder="Ej: materias destacadas, promedio, proyectos, logros..."
                                            {...register(`education.${idx}.description` as const, {
                                                setValueAs: normalizeOptional,
                                            })}
                                        />
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {fields.length === 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                            No hay items todavía. Tocá{" "}
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
                    onClick={addEducation}
                    className="h-9 px-3 text-xs border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                >
                    + Agregar educación
                </Button>

                {hasErrors && (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                        Hay errores en la sección de educación.
                    </div>
                )}
            </div>
        </div>
    );
}
