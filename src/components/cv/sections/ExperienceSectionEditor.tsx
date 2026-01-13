// src/components/cv/sections/ExperienceSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { arrayMove } from "@dnd-kit/sortable";

import type { CVSection, ExperienceItem } from "@/types/cv";
import { experienceSectionSchema } from "@/lib/zod/cv";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { SortableList } from "@/components/cv/dnd/SortableList";
import { SortableRow } from "@/components/cv/dnd/SortableRow";

import { cvEditorStyles, normalizeOptional } from "@/components/cv/styles/editorStyles";
import { cn } from "@/lib/utils";

type Props = {
    section: CVSection<"experience">; // data: ExperienceItem[]
    onChange: (section: CVSection<"experience">) => void;
};

type FormValues = {
    experiences: ExperienceItem[];
};

const createExp = (): ExperienceItem => ({
    id: crypto.randomUUID(),
    company: "",
    role: "",
    startDate: "", // requerido por schema: YYYY-MM (pero durante edición puede estar vacío)
    endDate: undefined, // ✅ opcional real
    description: "",
    items: [],
});

// UI helper: texto de error consistente
function ErrorText({ error }: { error?: FieldError }) {
    if (!error?.message) return null;
    return <p className="mt-1 text-[11px] text-red-300">{String(error.message)}</p>;
}

export function ExperienceSectionEditor({ section, onChange }: Props) {
    const defaultValues = useMemo<FormValues>(() => {
        return {
            experiences: Array.isArray(section.data) ? section.data : [],
        };
    }, [section.id]);

    const form = useForm<FormValues>({
        resolver: zodResolver(z.object({ experiences: experienceSectionSchema })),
        defaultValues,
        mode: "onChange",
        shouldUnregister: false,
    });

    const { control, register, watch, reset, setValue, formState } = form;

    const { fields, append, remove, move: moveExperience } = useFieldArray({
        control,
        name: "experiences",
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

            const next: ExperienceItem[] = (values.experiences ?? []).map((it) => ({
                id: it?.id ?? crypto.randomUUID(),
                company: it?.company ?? "",
                role: it?.role ?? "",
                startDate: it?.startDate ?? "",
                endDate: normalizeOptional((it as any)?.endDate ?? ""),
                description: normalizeOptional((it as any)?.description ?? ""),
                items: Array.isArray((it as any)?.items) ? (it as any).items : [],
            }));

            onChange({
                ...section,
                data: next,
            });
        });

        return () => sub.unsubscribe();
    }, [watch, onChange, section]);

    /* =================== MAX + Add =================== */

    const MAX_EXP = 10;
    const expCount = watch("experiences")?.length ?? fields.length;
    const reachedMax = expCount >= MAX_EXP;

    const addExperience = () => {
        if (reachedMax) return;
        append(createExp());
    };

    /* ================= DnD: Experiencias ================= */

    // ids para dnd (preferimos el id real del item)
    const ids = (watch("experiences") ?? []).map((it, idx) => String(it?.id ?? fields[idx]?.id));

    const onMoveExperience = (from: number, to: number) => moveExperience(from, to);

    /* ================= Bullets helpers ================= */

    const MAX_BULLETS = 10;

    const bulletsCount = (idx: number) =>
        (watch(`experiences.${idx}.items`) ?? []).length;

    const bulletsReachedMax = (idx: number) =>
        bulletsCount(idx) >= MAX_BULLETS;

    const addBullet = (idx: number) => {
        if (bulletsReachedMax(idx)) return;

        const current = (watch(`experiences.${idx}.items`) ?? []) as string[];
        setValue(`experiences.${idx}.items`, [...current, ""], {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    const removeBullet = (idx: number, bulletIndex: number) => {
        const current = (watch(`experiences.${idx}.items`) ?? []) as string[];
        setValue(
            `experiences.${idx}.items`,
            current.filter((_, i) => i !== bulletIndex),
            { shouldDirty: true, shouldValidate: true }
        );
    };

    const moveBullet = (idx: number, from: number, to: number) => {
        const current = (watch(`experiences.${idx}.items`) ?? []) as string[];
        const next = arrayMove(current, from, to);
        setValue(`experiences.${idx}.items`, next, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    /* ================= Errors helpers ================= */

    const experiencesArrayError =
        (formState.errors as any)?.experiences?.message ??
        (formState.errors as any)?.experiences?.root?.message ??
        undefined;

    const itemErrors = formState.errors?.experiences;
    const fieldError = (idx: number, key: keyof ExperienceItem) => {
        const row = itemErrors?.[idx] as Partial<Record<keyof ExperienceItem, FieldError>> | undefined;
        return row?.[key];
    };

    const inputErrorClass = "border-red-500/60 focus-visible:ring-red-500/30";

    const hasAny = (watch("experiences")?.length ?? 0) > 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-100">Experiencia</h3>
                    <p className="text-xs text-slate-400">
                        Agregá experiencias, ordenalas arrastrando y sumá items con logros / responsabilidades.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <Button
                        type="button"
                        onClick={addExperience}
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
                            Has alcanzado el límite de experiencias. Podés agregar una sección personalizada si necesitás extenderte.
                        </p>
                    )}
                </div>
            </div>

            {/* Array error (safety net) */}
            {experiencesArrayError && !reachedMax && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                    {String(experiencesArrayError)}
                </div>
            )}

            {/* List */}
            <SortableList ids={ids} onMove={onMoveExperience}>
                <div className="space-y-3">
                    {fields.map((f, idx) => {
                        const exp = watch("experiences")?.[idx];
                        const expId = String((exp?.id ?? f.id) as any);

                        const bullets = (exp?.items ?? []) as string[];
                        const bulletIds = bullets.map((_, bIdx) => `${expId}-b-${bIdx}`);

                        const title = exp?.role?.trim()
                            ? exp.role
                            : exp?.company?.trim()
                                ? exp.company
                                : `Experiencia ${idx + 1}`;

                        // field errors
                        const eRole = fieldError(idx, "role");
                        const eCompany = fieldError(idx, "company");
                        const eStartDate = fieldError(idx, "startDate");
                        const eEndDate = fieldError(idx, "endDate");
                        const eDescription = fieldError(idx, "description");

                        return (
                            <SortableRow
                                density="compact"
                                key={expId}
                                id={expId}
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
                                        className="h-8 px-2 text-xs border-red-500/50 text-red-200 bg-red-950/30 hover:bg-red-900/40 hover:text-red-100"
                                        onClick={() => remove(idx)}
                                    >
                                        Eliminar
                                    </Button>
                                }
                            >
                                <div className="space-y-4">
                                    {/* Rol / Empresa */}
                                    <div className={cvEditorStyles.grid2}>
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Rol</Label>
                                            <Input
                                                className={cn(cvEditorStyles.input, eRole && inputErrorClass)}
                                                placeholder="Ej: Frontend Developer"
                                                {...register(`experiences.${idx}.role` as const)}
                                            />
                                            <ErrorText error={eRole} />
                                        </div>

                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Empresa</Label>
                                            <Input
                                                className={cn(cvEditorStyles.input, eCompany && inputErrorClass)}
                                                placeholder="Ej: ACME S.A."
                                                {...register(`experiences.${idx}.company` as const)}
                                            />
                                            <ErrorText error={eCompany} />
                                        </div>
                                    </div>

                                    {/* Fechas (schema: YYYY-MM) */}
                                    <div className={cvEditorStyles.grid2}>
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Inicio</Label>
                                            <Input
                                                className={cn(cvEditorStyles.input, eStartDate && inputErrorClass)}
                                                placeholder="YYYY-MM (ej: 2024-07)"
                                                {...register(`experiences.${idx}.startDate` as const)}
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
                                                placeholder="En curso"
                                                {...register(`experiences.${idx}.endDate` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            {eEndDate ? (
                                                <ErrorText error={eEndDate} />
                                            ) : (
                                                <p className="text-[11px] text-slate-500">Si sigue vigente, dejalo vacío.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Descripción</Label>
                                        <Textarea
                                            className={cn(cvEditorStyles.textarea, eDescription && inputErrorClass)}
                                            placeholder="Resumen breve del puesto, stack, contexto..."
                                            {...register(`experiences.${idx}.description` as const, {
                                                setValueAs: normalizeOptional,
                                            })}
                                        />
                                        <ErrorText error={eDescription} />
                                    </div>

                                    {/* Bullets */}
                                    <div className="space-y-3 border-t border-slate-800/70 pt-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <Label className={cvEditorStyles.label}>Responsabilidades / Logros</Label>
                                                <p className="text-xs text-slate-400">
                                                    Ideal: 3–6 bullets con impacto y métricas si tenés.
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={bulletsReachedMax(idx)}
                                                    onClick={() => addBullet(idx)}
                                                    className={cn(
                                                        "h-8 px-2 text-xs",
                                                        bulletsReachedMax(idx)
                                                            ? "border-slate-700 text-slate-500 bg-slate-900/20 cursor-not-allowed opacity-70"
                                                            : "border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                                                    )}
                                                >
                                                    + Item
                                                </Button>

                                                {bulletsReachedMax(idx) && (
                                                    <p className="max-w-[240px] text-[11px] leading-snug text-slate-400 text-right">
                                                        Alcanzaste el máximo de 10 items para esta experiencia.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <SortableList ids={bulletIds} onMove={(from, to) => moveBullet(idx, from, to)}>
                                            <div className="space-y-2">
                                                {bullets.map((_, bIdx) => {
                                                    const rowId = `${expId}-b-${bIdx}`;

                                                    return (
                                                        <div key={rowId} className="rounded-lg border border-slate-800 bg-slate-950/50">
                                                            <SortableRow
                                                                density="compact"
                                                                id={rowId}
                                                                title={<span className="text-[11px] text-slate-400">Item {bIdx + 1}</span>}
                                                                headerRight={
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-slate-300 hover:text-red-200 hover:bg-red-900/20"
                                                                        onClick={() => removeBullet(idx, bIdx)}
                                                                        title="Eliminar item"
                                                                        aria-label="Eliminar item"
                                                                    >
                                                                        ✕
                                                                    </Button>
                                                                }
                                                            >
                                                                <div className="p-2">
                                                                    <Input
                                                                        className={cvEditorStyles.input}
                                                                        placeholder="Ej: Implementé X que mejoró Y en Z%"
                                                                        {...register(`experiences.${idx}.items.${bIdx}` as const)}
                                                                    />
                                                                </div>
                                                            </SortableRow>
                                                        </div>
                                                    );
                                                })}

                                                {bullets.length === 0 && (
                                                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                                                        Todavía no hay items. Tocá <span className="font-medium">“+ Item”</span>.
                                                    </div>
                                                )}
                                            </div>
                                        </SortableList>
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {!hasAny && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                            No hay experiencias todavía. Tocá <span className="font-medium">“+ Agregar”</span>.
                        </div>
                    )}
                </div>
            </SortableList>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800/70 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={addExperience}
                    disabled={reachedMax}
                    className={cn(
                        "h-9 px-3 text-xs",
                        reachedMax
                            ? "border-slate-700 text-slate-500 bg-slate-900/20 cursor-not-allowed opacity-70"
                            : "border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                    )}
                >
                    + Agregar experiencia
                </Button>

                {reachedMax && (
                    <p className="text-[11px] text-slate-400">
                        Has alcanzado el límite de experiencias. Podés agregar una sección personalizada si necesitás extenderte.
                    </p>
                )}
            </div>
        </div>
    );
}

