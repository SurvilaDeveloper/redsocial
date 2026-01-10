// src/components/cv/sections/CustomSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { CVSection, CustomData, CustomItem } from "@/types/cv";
import { customSectionSchema } from "@/lib/zod/cv";

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

/* ================= Helpers ================= */

const createItem = (): CustomItem => ({
    id: crypto.randomUUID(),
    title: "",
    subtitle: undefined,
    description: undefined,
    date: undefined,
    url: undefined,
});

type Props = {
    section: CVSection<"custom">; // data: CustomData
    onChange: (section: CVSection<"custom">) => void;
};

type FormValues = {
    title: string;
    items: CustomItem[];
};

/* ================= Component ================= */

export function CustomSectionEditor({ section, onChange }: Props) {
    const defaultValues = useMemo<FormValues>(() => {
        const data = (section.data ?? {}) as CustomData;

        return {
            title: data?.title ?? "",
            items: Array.isArray(data?.items) ? data.items : [],
        };
    }, [section.id]);

    const form = useForm<FormValues>({
        resolver: zodResolver(z.object({ title: z.string().min(1), items: z.array(z.any()) }).superRefine((val, ctx) => {
            // validación real la hace el schema del backend, esto es solo para que RHF tenga algo coherente
            const parsed = customSectionSchema.safeParse({ title: val.title, items: val.items });
            if (!parsed.success) {
                // No cargamos issues acá para no bloquear el preview (igual mostramos hasErrors abajo con formState)
                return;
            }
        })),
        defaultValues,
        mode: "onChange",
        shouldUnregister: false,
    });

    const { control, register, watch, reset, formState } = form;

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "items",
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

            const nextItems: CustomItem[] = (values.items ?? []).map((it) => ({
                id: it?.id ?? crypto.randomUUID(),
                title: it?.title ?? "",
                subtitle: normalizeOptional((it as any)?.subtitle ?? ""),
                description: normalizeOptional((it as any)?.description ?? ""),
                date: normalizeOptional((it as any)?.date ?? ""),
                url: normalizeOptional((it as any)?.url ?? ""),
            }));

            onChange({
                ...section,
                data: {
                    title: values.title ?? "",
                    items: nextItems,
                },
            });
        });

        return () => sub.unsubscribe();
    }, [watch, onChange, section]);

    const addItem = () => append(createItem());

    // ids para dnd (preferimos el id real del item)
    const ids = (watch("items") ?? []).map((it, idx) =>
        String(it?.id ?? fields[idx]?.id)
    );

    const hasAny = fields.length > 0;
    const hasErrors = Object.keys(formState.errors ?? {}).length > 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-100">
                        Sección personalizada
                    </h3>
                    <p className="text-xs text-slate-400">
                        Usala para certificaciones, cursos, premios, publicaciones, etc.
                        Podés reordenar los items arrastrando.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={addItem}
                    className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-50"
                >
                    + Agregar
                </Button>
            </div>

            {/* Section title */}
            <div className={cvEditorStyles.block}>
                <Label className={cvEditorStyles.label}>Título de la sección</Label>
                <Input
                    className={cvEditorStyles.input}
                    placeholder="Ej: Certificaciones, Cursos, Premios..."
                    {...register("title", {
                        setValueAs: (v) => (typeof v === "string" ? v : ""),
                    })}
                />
            </div>

            {/* Items (DnD) */}
            <SortableList ids={ids} onMove={(from, to) => move(from, to)}>
                <div className="space-y-3">
                    {fields.map((field, idx) => {
                        const it = watch("items")?.[idx];
                        const itemId = String((it?.id ?? field.id) as any);

                        const title = it?.title?.trim()
                            ? it.title
                            : `Item ${idx + 1}`;

                        return (
                            <SortableRow
                                key={itemId}
                                density="compact"
                                id={itemId}
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
                                        onClick={() => remove(idx)}
                                        className="h-8 px-2 text-xs border-red-500/50 text-red-200 bg-red-950/30 hover:bg-red-900/40 hover:text-red-100"
                                    >
                                        Eliminar
                                    </Button>
                                }
                            >
                                <div className="space-y-4">
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Título</Label>
                                        <Input
                                            className={cvEditorStyles.input}
                                            placeholder="Ej: AWS Cloud Practitioner"
                                            {...register(`items.${idx}.title` as const)}
                                        />
                                    </div>

                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Subtítulo</Label>
                                        <Input
                                            className={cvEditorStyles.input}
                                            placeholder="Ej: Coursera / Google / Institución (opcional)"
                                            {...register(`items.${idx}.subtitle` as const, {
                                                setValueAs: normalizeOptional,
                                            })}
                                        />
                                    </div>

                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Descripción</Label>
                                        <Textarea
                                            className={cvEditorStyles.textarea}
                                            placeholder="Detalles, contenido, logros, stack... (opcional)"
                                            {...register(`items.${idx}.description` as const, {
                                                setValueAs: normalizeOptional,
                                            })}
                                        />
                                    </div>

                                    <div className={cvEditorStyles.grid2}>
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Fecha</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                placeholder="YYYY o YYYY-MM (ej: 2025 o 2025-10)"
                                                {...register(`items.${idx}.date` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            <p className="text-[11px] text-slate-500">
                                                Formato: <span className="font-medium">YYYY</span> o{" "}
                                                <span className="font-medium">YYYY-MM</span>
                                            </p>
                                        </div>

                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>URL</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                placeholder="https://... (opcional)"
                                                {...register(`items.${idx}.url` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {!hasAny && (
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
                    onClick={addItem}
                    className="h-9 px-3 text-xs border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                >
                    + Agregar item
                </Button>

                {hasErrors && (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                        Hay errores en la sección personalizada.
                    </div>
                )}
            </div>
        </div>
    );
}