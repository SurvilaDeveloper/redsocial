// src/components/cv/sections/ExperienceSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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

import {
    cvEditorStyles,
    normalizeOptional,
} from "@/components/cv/styles/editorStyles";

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

    const addExperience = () => append(createExp());

    /* ================= DnD: Experiencias ================= */

    // ids para dnd (preferimos el id real del item)
    const ids = (watch("experiences") ?? []).map((it, idx) =>
        String(it?.id ?? fields[idx]?.id)
    );

    const onMoveExperience = (from: number, to: number) => {
        moveExperience(from, to);
    };

    /* ================= Bullets helpers ================= */

    const addBullet = (idx: number) => {
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

    const hasAny = (watch("experiences")?.length ?? 0) > 0;
    const hasErrors = Object.keys(formState.errors ?? {}).length > 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-100">Experiencia</h3>
                    <p className="text-xs text-slate-400">
                        Agregá experiencias, ordenalas arrastrando y sumá items con logros /
                        responsabilidades.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={addExperience}
                    className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-50"
                >
                    + Agregar
                </Button>
            </div>

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

                        return (
                            <SortableRow
                                density="compact"
                                key={expId}
                                id={expId}
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
                                                className={cvEditorStyles.input}
                                                placeholder="Ej: Frontend Developer"
                                                {...register(`experiences.${idx}.role` as const)}
                                            />
                                        </div>

                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Empresa</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                placeholder="Ej: ACME S.A."
                                                {...register(`experiences.${idx}.company` as const)}
                                            />
                                        </div>
                                    </div>

                                    {/* Fechas (schema: YYYY-MM) */}
                                    <div className={cvEditorStyles.grid2}>
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Inicio</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                type="month"
                                                {...register(`experiences.${idx}.startDate` as const)}
                                            />
                                            <p className="text-[11px] text-slate-500">
                                                Formato: <span className="font-medium">YYYY-MM</span>
                                            </p>
                                        </div>

                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Fin</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                type="month"
                                                placeholder="En curso"
                                                {...register(`experiences.${idx}.endDate` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            <p className="text-[11px] text-slate-500">
                                                Si sigue vigente, dejalo vacío.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Descripción</Label>
                                        <Textarea
                                            className={cvEditorStyles.textarea}
                                            placeholder="Resumen breve del puesto, stack, contexto..."
                                            {...register(`experiences.${idx}.description` as const, {
                                                setValueAs: normalizeOptional,
                                            })}
                                        />
                                    </div>

                                    {/* Bullets */}
                                    <div className="space-y-3 border-t border-slate-800/70 pt-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <Label className={cvEditorStyles.label}>
                                                    Responsabilidades / Logros
                                                </Label>
                                                <p className="text-xs text-slate-400">
                                                    Ideal: 3–6 bullets con impacto y métricas si tenés.
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-2 text-xs border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                                                onClick={() => addBullet(idx)}
                                            >
                                                + Item
                                            </Button>
                                        </div>

                                        <SortableList
                                            ids={bulletIds}
                                            onMove={(from, to) => moveBullet(idx, from, to)}
                                        >
                                            <div className="space-y-2">
                                                {bullets.map((_, bIdx) => {
                                                    const rowId = `${expId}-b-${bIdx}`;

                                                    return (
                                                        <div
                                                            key={rowId}
                                                            className="rounded-lg border border-slate-800 bg-slate-950/50"
                                                        >
                                                            <SortableRow
                                                                density="compact"
                                                                id={rowId}
                                                                title={
                                                                    <span className="text-[11px] text-slate-400">
                                                                        Item {bIdx + 1}
                                                                    </span>
                                                                }
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
                                                                        {...register(
                                                                            `experiences.${idx}.items.${bIdx}` as const
                                                                        )}
                                                                    />
                                                                </div>
                                                            </SortableRow>
                                                        </div>
                                                    );
                                                })}

                                                {bullets.length === 0 && (
                                                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                                                        Todavía no hay items. Tocá{" "}
                                                        <span className="font-medium">“+ Item”</span>.
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
                            No hay experiencias todavía. Tocá{" "}
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
                    onClick={addExperience}
                    className="h-9 px-3 text-xs border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                >
                    + Agregar experiencia
                </Button>

                {hasErrors && (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                        Hay errores en la sección de experiencia.
                    </div>
                )}
            </div>
        </div>
    );
}
