// src/components/cv/sections/CustomSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
    normalizeOptionalSoft,
} from "@/components/cv/styles/editorStyles";

import { cn } from "@/lib/utils";

/* ================= Helpers ================= */

const createItem = (): CustomItem => ({
    id: crypto.randomUUID(),
    title: "",
    subtitle: undefined,
    description: undefined,
    date: undefined,
    url: undefined,
});

// UI helper: texto de error consistente
function ErrorText({ error }: { error?: FieldError }) {
    if (!error?.message) return null;
    return <p className="mt-1 text-[11px] text-red-300">{String(error.message)}</p>;
}

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
        resolver: zodResolver(customSectionSchema),
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
                // ⬇️ Soft para permitir escribir espacios normalmente mientras tipeás
                subtitle: normalizeOptionalSoft((it as any)?.subtitle ?? ""),
                description: normalizeOptionalSoft((it as any)?.description ?? ""),
                // ⬇️ Hard trim en date/url está OK
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

    /* =================== MAX + “idiomas pro” add lock =================== */

    const MAX_ITEMS = 10;

    const items = watch("items") ?? [];
    const count = items.length ?? fields.length;
    const reachedMax = count >= MAX_ITEMS;

    // safety net: error a nivel root/array
    const itemsArrayError =
        (formState.errors as any)?.items?.message ??
        (formState.errors as any)?.items?.root?.message ??
        undefined;

    const titleError = (formState.errors as any)?.title as FieldError | undefined;

    // ✅ críticos por item: title vacío o duplicado cae en items[i].title
    const itemTitleHasError = (idx: number) =>
        Boolean((formState.errors as any)?.items?.[idx]?.title?.message);

    // ✅ críticos globales: title sección o algún item.title o array error
    const hasCriticalErrors =
        Boolean(titleError?.message) ||
        Boolean(itemsArrayError) ||
        items.some((_, idx) => itemTitleHasError(idx));

    const addDisabled = reachedMax || hasCriticalErrors;

    const addHint = reachedMax
        ? `Has alcanzado el límite de items (${MAX_ITEMS}).`
        : hasCriticalErrors
            ? "Hay errores críticos (título vacío o duplicado). Corregilos para poder agregar un item nuevo."
            : null;

    const addItem = () => {
        if (addDisabled) return;
        append(createItem());
    };

    /* =================== DnD =================== */

    const ids = (items ?? []).map((it: any, idx: number) =>
        String(it?.id ?? fields[idx]?.id)
    );
    const hasAny = (items?.length ?? 0) > 0;

    /* =================== Errors helpers =================== */

    const itemErrors = formState.errors?.items;
    const fieldError = (idx: number, key: keyof CustomItem) => {
        const row = itemErrors?.[idx] as Partial<Record<keyof CustomItem, FieldError>> | undefined;
        return row?.[key];
    };

    const inputErrorClass = "border-red-500/60 focus-visible:ring-red-500/30";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-100">Sección personalizada</h3>
                    <p className="text-xs text-slate-400">
                        Usala para certificaciones, cursos, premios, publicaciones, etc. Podés reordenar los items arrastrando.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <Button
                        type="button"
                        onClick={addItem}
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
                        <p className="max-w-[280px] text-[11px] leading-snug text-slate-400 text-right">
                            {addHint}
                        </p>
                    )}
                </div>
            </div>

            {/* Section title */}
            <div className={cvEditorStyles.block}>
                <Label className={cvEditorStyles.label}>Título de la sección</Label>
                <Input
                    className={cn(cvEditorStyles.input, titleError && inputErrorClass)}
                    placeholder="Ej: Certificaciones, Cursos, Premios..."
                    {...register("title", {
                        setValueAs: (v) => (typeof v === "string" ? v : ""),
                    })}
                />
                <ErrorText error={titleError} />
            </div>

            {/* Array error (safety net) */}
            {itemsArrayError && !reachedMax && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                    {String(itemsArrayError)}
                </div>
            )}

            {/* Items (DnD) */}
            <SortableList ids={ids} onMove={(from, to) => move(from, to)}>
                <div className="space-y-3">
                    {fields.map((field, idx) => {
                        const it = items?.[idx] as CustomItem | undefined;
                        const itemId = String((it?.id ?? field.id) as any);

                        const title = it?.title?.trim() ? it.title : `Item ${idx + 1}`;

                        const eTitle = fieldError(idx, "title");
                        const eSubtitle = fieldError(idx, "subtitle");
                        const eDescription = fieldError(idx, "description");
                        const eDate = fieldError(idx, "date");
                        const eUrl = fieldError(idx, "url");

                        return (
                            <SortableRow
                                key={itemId}
                                density="compact"
                                id={itemId}
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
                                        onClick={() => remove(idx)}
                                        className="h-8 px-2 text-xs border-red-500/50 text-red-200 bg-red-950/30 hover:bg-red-900/40 hover:text-red-100"
                                    >
                                        Eliminar
                                    </Button>
                                }
                            >
                                <div className="space-y-4">
                                    {/* Título */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Título</Label>
                                        <Input
                                            className={cn(cvEditorStyles.input, eTitle && inputErrorClass)}
                                            placeholder="Ej: AWS Cloud Practitioner"
                                            {...register(`items.${idx}.title` as const)}
                                        />
                                        <ErrorText error={eTitle} />
                                    </div>

                                    {/* Subtítulo */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Subtítulo</Label>
                                        <Input
                                            className={cn(cvEditorStyles.input, eSubtitle && inputErrorClass)}
                                            placeholder="Ej: Coursera / Google / Institución (opcional)"
                                            {...register(`items.${idx}.subtitle` as const, {
                                                setValueAs: (v) =>
                                                    normalizeOptionalSoft(typeof v === "string" ? v : ""),
                                            })}
                                        />
                                        <ErrorText error={eSubtitle} />
                                    </div>

                                    {/* Descripción */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Descripción</Label>
                                        <Textarea
                                            className={cn(cvEditorStyles.textarea, eDescription && inputErrorClass)}
                                            placeholder="Detalles, contenido, logros, stack... (opcional)"
                                            {...register(`items.${idx}.description` as const, {
                                                setValueAs: (v) =>
                                                    normalizeOptionalSoft(typeof v === "string" ? v : ""),
                                            })}
                                        />
                                        <ErrorText error={eDescription} />
                                    </div>

                                    <div className={cvEditorStyles.grid2}>
                                        {/* Fecha */}
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Fecha</Label>
                                            <Input
                                                className={cn(cvEditorStyles.input, eDate && inputErrorClass)}
                                                placeholder="YYYY o YYYY-MM (ej: 2025 o 2025-10)"
                                                {...register(`items.${idx}.date` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            {eDate ? (
                                                <ErrorText error={eDate} />
                                            ) : (
                                                <p className="text-[11px] text-slate-500">
                                                    Formato: <span className="font-medium">YYYY</span> o{" "}
                                                    <span className="font-medium">YYYY-MM</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* URL */}
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>URL</Label>
                                            <Input
                                                className={cn(cvEditorStyles.input, eUrl && inputErrorClass)}
                                                placeholder="https://... (opcional)"
                                                {...register(`items.${idx}.url` as const, {
                                                    setValueAs: normalizeOptional,
                                                })}
                                            />
                                            <ErrorText error={eUrl} />
                                        </div>
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {!hasAny && (
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
                    onClick={addItem}
                    disabled={addDisabled}
                    className={cn(
                        "h-9 px-3 text-xs",
                        addDisabled
                            ? "border-slate-700 text-slate-500 bg-slate-900/20 cursor-not-allowed opacity-70"
                            : "border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                    )}
                >
                    + Agregar item
                </Button>

                {addHint && <p className="text-[11px] text-slate-400">{addHint}</p>}
            </div>
        </div>
    );
}