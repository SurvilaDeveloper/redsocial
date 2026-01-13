// src/components/cv/sections/EducationSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray, type FieldError } from "react-hook-form";
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

import { cvEditorStyles, normalizeOptional } from "@/components/cv/styles/editorStyles";
import { cn } from "@/lib/utils";

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

// UI helper: texto de error consistente
function ErrorText({ error }: { error?: FieldError }) {
    if (!error?.message) return null;
    return <p className="mt-1 text-[11px] text-red-300">{String(error.message)}</p>;
}

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

    const MAX_EDU = 10;
    const eduCount = watch("education")?.length ?? fields.length;
    const reachedMax = eduCount >= MAX_EDU;

    const addEducation = () => {
        if (reachedMax) return;
        append(createEdu());
    };

    // ids para dnd (preferimos el id real del item)
    const ids = (watch("education") ?? []).map((it, idx) => String(it?.id ?? fields[idx]?.id));

    //const hasErrors = Object.keys(formState.errors ?? {}).length > 0;

    const educationArrayError =
        (formState.errors as any)?.education?.message ??
        (formState.errors as any)?.education?.root?.message ??
        undefined;

    // helpers para errores por campo
    const itemErrors = formState.errors?.education;
    const fieldError = (idx: number, key: keyof EducationItem) => {
        const row = itemErrors?.[idx] as Partial<Record<keyof EducationItem, FieldError>> | undefined;
        return row?.[key];
    };

    const inputErrorClass = "border-red-500/60 focus-visible:ring-red-500/30";

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

                <div className="flex flex-col items-end gap-1">
                    <Button
                        type="button"
                        onClick={addEducation}
                        disabled={reachedMax}
                        className={cn(
                            "h-9 px-3 rounded-md text-xs font-medium",
                            reachedMax
                                ? "bg-slate-800 text-slate-400 cursor-not-allowed opacity-70"
                                : "bg-emerald-600 hover:bg-emerald-500 text-slate-50"
                        )}
                    >
                        + Agregar
                    </Button>

                    {reachedMax && (
                        <p className="max-w-[260px] text-[11px] leading-snug text-slate-400 text-right">
                            Has alcanzado el límite de entradas para educación. Podés agregar una sección personalizada si necesitás extenderte.
                        </p>
                    )}
                </div>
            </div>

            {/* List */}
            <SortableList ids={ids} onMove={(from, to) => move(from, to)}>
                <div className="space-y-3">
                    {fields.map((f, idx) => {
                        const id = String((watch("education")?.[idx]?.id ?? f.id) as any);

                        const eInstitution = fieldError(idx, "institution");
                        const eDegree = fieldError(idx, "degree");
                        const eStartDate = fieldError(idx, "startDate");
                        const eEndDate = fieldError(idx, "endDate");
                        const eDescription = fieldError(idx, "description");

                        return (
                            <SortableRow
                                density="compact"
                                key={id}
                                id={id}
                                title={
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-100">Educación {idx + 1}</span>
                                        <span className="text-[11px] text-slate-400">(arrastrá para reordenar)</span>
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
                                            className={cn(cvEditorStyles.input, eInstitution && inputErrorClass)}
                                            placeholder="Ej: Universidad de Buenos Aires"
                                            {...register(`education.${idx}.institution` as const)}
                                        />
                                        <p className="text-xs text-slate-500">Nombre de la institución o academia.</p>
                                        <ErrorText error={eInstitution} />
                                    </div>

                                    {/* Título */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Título / Carrera</Label>
                                        <Input
                                            className={cn(cvEditorStyles.input, eDegree && inputErrorClass)}
                                            placeholder="Ej: Licenciatura en Sistemas"
                                            {...register(`education.${idx}.degree` as const)}
                                        />
                                        <ErrorText error={eDegree} />
                                    </div>

                                    {/* Fechas (schema: YYYY-MM) */}
                                    <div className={cvEditorStyles.grid2}>
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Inicio</Label>
                                            <Input
                                                className={cn(cvEditorStyles.input, eStartDate && inputErrorClass)}
                                                placeholder="YYYY o YYYY-MM (ej: 2022 o 2022-01)"
                                                {...register(`education.${idx}.startDate` as const)}
                                            />
                                            {eStartDate ?
                                                <ErrorText error={eStartDate} />
                                                :
                                                <p className="text-[11px] text-slate-500">
                                                    Formato: <span className="font-medium">YYYY o YYYY-MM</span>
                                                </p>}

                                        </div>

                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Fin</Label>
                                            <Input
                                                className={cn(cvEditorStyles.input, eEndDate && inputErrorClass)}
                                                placeholder="YYYY o YYYY-MM (o vacío si está en curso)"
                                                {...register(`education.${idx}.endDate` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            {eEndDate ?
                                                <ErrorText error={eEndDate} />
                                                :
                                                <p className="text-[11px] text-slate-500">Dejá vacío si está en curso.</p>
                                            }
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Descripción</Label>
                                        <Textarea
                                            className={cn(cvEditorStyles.textarea, eDescription && inputErrorClass)}
                                            placeholder="Ej: materias destacadas, promedio, proyectos, logros..."
                                            {...register(`education.${idx}.description` as const, {
                                                setValueAs: normalizeOptional,
                                            })}
                                        />
                                        <ErrorText error={eDescription} />
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {fields.length === 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                            No hay items todavía. Tocá <span className="font-medium">“+ Agregar”</span>.
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
                    disabled={reachedMax}
                    className={cn(
                        "h-9 px-3 text-xs",
                        reachedMax
                            ? "border-slate-700 text-slate-500 bg-slate-900/20 cursor-not-allowed opacity-70"
                            : "border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                    )}
                >
                    + Agregar educación
                </Button>

                {reachedMax && (
                    <p className="text-[11px] text-slate-400">
                        Has alcanzado el límite de entradas para educación. Podés agregar una sección personalizada si necesitás extenderte.
                    </p>
                )}

                {educationArrayError && !reachedMax && (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                        {String(educationArrayError)}
                    </div>
                )}

            </div>
        </div>
    );
}

