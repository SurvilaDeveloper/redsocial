// src/components/cv/sections/LanguagesSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { languagesSectionSchema, LANGUAGE_LEVELS } from "@/lib/zod/cv";
import type { LanguageData, CommonLanguage } from "@/types/cv";
import { COMMON_LANGUAGES } from "@/types/cv";
import { LANGUAGE_LABELS } from "@/types/cvLanguages";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { SortableList } from "@/components/cv/dnd/SortableList";
import { SortableRow } from "@/components/cv/dnd/SortableRow";

import { cvEditorStyles, normalizeOptional, normalizeOptionalSoft } from "@/components/cv/styles/editorStyles";
import { cn } from "@/lib/utils";

type Props = {
    value: LanguageData[];
    onChange: (value: LanguageData[]) => void;
};

type FormValues = {
    languages: LanguageData[];
};

function isCommonLanguage(code: string): code is CommonLanguage {
    return code in LANGUAGE_LABELS;
}

const createLang = (): LanguageData => ({
    id: crypto.randomUUID(),
    code: "english",
    name: LANGUAGE_LABELS.english,
    level: "basic",
    certification: undefined,
});

// UI helper: texto de error consistente
function ErrorText({ error }: { error?: FieldError }) {
    if (!error?.message) return null;
    return <p className="mt-1 text-[11px] text-red-300">{String(error.message)}</p>;
}

export function LanguagesSectionEditor({ value, onChange }: Props) {
    const defaultValues = useMemo<FormValues>(() => {
        return { languages: Array.isArray(value) ? value : [] };
    }, [value]);

    const form = useForm<FormValues>({
        resolver: zodResolver(z.object({ languages: languagesSectionSchema })),
        defaultValues,
        mode: "onChange",
        shouldUnregister: false,
    });

    const { control, register, watch, reset, setValue, formState, getValues, trigger } = form;

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "languages",
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

    // ✅ autocorregir "name" cuando el code NO es "other"
    useEffect(() => {
        const langs = getValues("languages") ?? [];
        langs.forEach((lang, idx) => {
            const code = lang?.code;
            if (!code) return;

            if (code !== "other" && isCommonLanguage(code)) {
                const expected = LANGUAGE_LABELS[code];
                if (lang.name !== expected) {
                    setValue(`languages.${idx}.name`, expected, {
                        shouldDirty: true,
                        shouldValidate: true,
                    });
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getValues, setValue]);

    // ✅ form -> externo (NO bloqueamos por schema para preview reactivo)
    useEffect(() => {
        const sub = watch((values) => {
            if (isResettingRef.current) return;

            const next: LanguageData[] = (values.languages ?? []).map((l) => {
                const code = (l?.code ?? "english") as LanguageData["code"];

                const name =
                    code !== "other" && isCommonLanguage(code) ? LANGUAGE_LABELS[code] : (l?.name ?? "");

                return {
                    id: l?.id ?? crypto.randomUUID(),
                    code,
                    name,
                    level: (l?.level ?? "basic") as LanguageData["level"],
                    certification: normalizeOptionalSoft(((l as any)?.certification ?? "") as string),
                };
            });

            onChange(next);
        });

        return () => sub.unsubscribe();
    }, [watch, onChange]);

    /* =================== MAX + Add =================== */

    const MAX_LANG = 10;
    const langCount = watch("languages")?.length ?? fields.length;
    const reachedMax = langCount >= MAX_LANG;

    // ✅ Detectar “duplicados” por error Zod (path: [i,"code"])
    const duplicateMsg = "No se pueden repetir idiomas";
    const hasDuplicateError =
        Array.isArray((formState.errors as any)?.languages) &&
        (formState.errors as any).languages.some((row: any) => row?.code?.message === duplicateMsg);

    const blockAdd = reachedMax || hasDuplicateError;

    const addLanguage = async () => {
        if (blockAdd) return;

        append(createLang());

        // ✅ revalida por si el lang default choca con algo
        await trigger("languages");
    };

    /* =================== DnD =================== */

    const ids = (watch("languages") ?? []).map((it, idx) => String(it?.id ?? fields[idx]?.id));
    const hasAny = (watch("languages")?.length ?? 0) > 0;

    /* =================== Errors helpers =================== */

    const languagesArrayError =
        (formState.errors as any)?.languages?.message ??
        (formState.errors as any)?.languages?.root?.message ??
        undefined;

    const itemErrors = formState.errors?.languages;
    const fieldError = (idx: number, key: keyof LanguageData) => {
        const row = itemErrors?.[idx] as Partial<Record<keyof LanguageData, FieldError>> | undefined;
        return row?.[key];
    };

    const inputErrorClass = "border-red-500/60 focus-visible:ring-red-500/30";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-100">Idiomas</h3>
                    <p className="text-xs text-slate-400">
                        Agregá idiomas y su nivel. Podés reordenarlos arrastrando.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <Button
                        type="button"
                        onClick={addLanguage}
                        disabled={blockAdd}
                        className={cn(
                            "h-9 px-3 rounded-md text-xs font-medium",
                            blockAdd
                                ? "bg-slate-800 text-slate-400 cursor-not-allowed opacity-70"
                                : "bg-emerald-600 hover:bg-emerald-500 text-slate-50"
                        )}
                    >
                        + Agregar
                    </Button>

                    {reachedMax && (
                        <p className="max-w-[260px] text-[11px] leading-snug text-slate-400 text-right">
                            Has alcanzado el límite de idiomas (10). Podés usar una sección personalizada si necesitás
                            extenderte.
                        </p>
                    )}

                    {!reachedMax && hasDuplicateError && (
                        <p className="max-w-[260px] text-[11px] leading-snug text-red-300 text-right">
                            Corregí los idiomas repetidos para poder agregar uno nuevo.
                        </p>
                    )}
                </div>
            </div>

            {/* Array error (safety net) */}
            {languagesArrayError && !reachedMax && !hasDuplicateError && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                    {String(languagesArrayError)}
                </div>
            )}

            {/* List */}
            <SortableList ids={ids} onMove={(from, to) => move(from, to)}>
                <div className="space-y-3">
                    {fields.map((field, index) => {
                        const current = watch("languages")?.[index];
                        const rowId = String((current?.id ?? field.id) as any);

                        const title =
                            current?.code && current.code !== "other" && isCommonLanguage(current.code)
                                ? LANGUAGE_LABELS[current.code]
                                : current?.name?.trim()
                                    ? current.name
                                    : `Idioma ${index + 1}`;

                        const codeValue = (current?.code ?? "english") as LanguageData["code"];
                        const levelValue = (current?.level ?? "basic") as LanguageData["level"];
                        const nameDisabled = codeValue !== "other";

                        const eCode = fieldError(index, "code");
                        const eName = fieldError(index, "name");
                        const eLevel = fieldError(index, "level");
                        const eCertification = fieldError(index, "certification");

                        return (
                            <SortableRow
                                key={rowId}
                                density="compact"
                                id={rowId}
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
                                        onClick={async () => {
                                            remove(index);
                                            await trigger("languages");
                                        }}
                                        className="h-8 px-2 text-xs border-red-500/50 text-red-200 bg-red-950/30 hover:bg-red-900/40 hover:text-red-100"
                                    >
                                        Eliminar
                                    </Button>
                                }
                            >
                                <div className="space-y-4">
                                    {/* Idioma (code) */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Idioma</Label>

                                        <Select
                                            value={String(codeValue)}
                                            onValueChange={async (v) => {
                                                const code = v as LanguageData["code"];

                                                setValue(`languages.${index}.code`, code, {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                });

                                                if (code !== "other" && isCommonLanguage(code)) {
                                                    setValue(`languages.${index}.name`, LANGUAGE_LABELS[code], {
                                                        shouldValidate: true,
                                                        shouldDirty: true,
                                                    });
                                                } else {
                                                    setValue(`languages.${index}.name`, "", {
                                                        shouldValidate: true,
                                                        shouldDirty: true,
                                                    });
                                                }

                                                // ✅ revalida el array completo (dup superRefine)
                                                await trigger("languages");
                                            }}
                                        >
                                            <SelectTrigger className={cn(cvEditorStyles.input, eCode && inputErrorClass)}>
                                                <SelectValue placeholder="Seleccioná un idioma" />
                                            </SelectTrigger>

                                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-64">
                                                {COMMON_LANGUAGES.map((lang) => (
                                                    <SelectItem key={lang} value={String(lang)}>
                                                        {LANGUAGE_LABELS[lang]}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="other">Otro</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <p className="text-[11px] text-slate-500">
                                            Elegí “Otro” si querés escribir un idioma personalizado.
                                        </p>
                                        <ErrorText error={eCode} />
                                    </div>

                                    {/* Nombre (solo si other) */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Nombre</Label>
                                        <Input
                                            {...register(`languages.${index}.name` as const, {
                                                setValueAs: (v) => (typeof v === "string" ? v : ""),
                                                onChange: () => {
                                                    // ✅ revalida duplicados al tipear "otro"
                                                    trigger("languages");
                                                },
                                            })}
                                            placeholder="Ej: Japonés"
                                            disabled={nameDisabled}
                                            className={cn(
                                                cvEditorStyles.input,
                                                nameDisabled && "opacity-70 cursor-not-allowed bg-slate-900/60 text-slate-300",
                                                eName && inputErrorClass
                                            )}
                                        />

                                        {nameDisabled ? (
                                            <p className="text-[11px] text-slate-500">Para editar el nombre, elegí “Otro”.</p>
                                        ) : eName ? (
                                            <ErrorText error={eName} />
                                        ) : (
                                            <p className="text-[11px] text-slate-500">
                                                Escribí el nombre del idioma si no está en la lista.
                                            </p>
                                        )}

                                        {nameDisabled && <ErrorText error={eName} />}
                                    </div>

                                    {/* Nivel */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Nivel</Label>

                                        <Select
                                            value={String(levelValue)}
                                            onValueChange={async (v) => {
                                                setValue(`languages.${index}.level`, v as any, {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                });
                                                await trigger("languages");
                                            }}
                                        >
                                            <SelectTrigger className={cn(cvEditorStyles.input, eLevel && inputErrorClass)}>
                                                <SelectValue placeholder="Nivel" />
                                            </SelectTrigger>

                                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                                                {LANGUAGE_LEVELS.map((lvl) => (
                                                    <SelectItem key={lvl} value={String(lvl)}>
                                                        {lvl}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <ErrorText error={eLevel} />
                                    </div>

                                    {/* Certificación */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Certificación</Label>
                                        <Input
                                            {...register(`languages.${index}.certification` as const, {
                                                setValueAs: (v) => normalizeOptionalSoft(typeof v === "string" ? v : ""),
                                                // opcional: si querés disparar validación reactiva
                                                onChange: () => {
                                                    form.trigger("languages");
                                                },
                                            })}
                                            placeholder="Ej: IELTS 7.0 (2024) · CAE (C1) · DELF B2"
                                            className={cn(cvEditorStyles.input, eCertification && inputErrorClass)}
                                        />

                                        <p className="text-[11px] text-slate-500">
                                            Opcional. Poné examen + nivel/puntaje + año, si aplica.
                                        </p>
                                        <ErrorText error={eCertification} />
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {!hasAny && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                            No hay idiomas todavía. Tocá <span className="font-medium">“+ Agregar”</span>.
                        </div>
                    )}
                </div>
            </SortableList>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800/70 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={addLanguage}
                    disabled={blockAdd}
                    className={cn(
                        "h-9 px-3 text-xs",
                        blockAdd
                            ? "border-slate-700 text-slate-500 bg-slate-900/20 cursor-not-allowed opacity-70"
                            : "border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                    )}
                >
                    + Agregar idioma
                </Button>

                {reachedMax && (
                    <p className="text-[11px] text-slate-400">
                        Has alcanzado el límite de idiomas (10). Podés usar una sección personalizada si necesitás
                        extenderte.
                    </p>
                )}

                {!reachedMax && hasDuplicateError && (
                    <p className="text-[11px] text-red-300">
                        Corregí los idiomas repetidos para poder agregar uno nuevo.
                    </p>
                )}
            </div>
        </div>
    );
}
