// src/components/cv/sections/LanguagesSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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

import {
    cvEditorStyles,
    normalizeOptional,
} from "@/components/cv/styles/editorStyles";

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

    const { control, register, watch, reset, setValue, formState, getValues } =
        form;

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
    // (la validación strict del schema exige que coincida)
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

                // Si no es other, el name debe ser el label esperado
                const name =
                    code !== "other" && isCommonLanguage(code)
                        ? LANGUAGE_LABELS[code]
                        : (l?.name ?? "");

                return {
                    id: l?.id ?? crypto.randomUUID(),
                    code,
                    name,
                    level: (l?.level ?? "basic") as LanguageData["level"],
                    certification: normalizeOptional((l as any)?.certification ?? ""),
                };
            });

            onChange(next);
        });

        return () => sub.unsubscribe();
    }, [watch, onChange]);

    const addLanguage = () => append(createLang());

    // ids para dnd (preferimos el id real del item)
    const ids = (watch("languages") ?? []).map((it, idx) =>
        String(it?.id ?? fields[idx]?.id)
    );

    const hasAny = fields.length > 0;
    const hasErrors = Object.keys(formState.errors ?? {}).length > 0;

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

                <Button
                    type="button"
                    onClick={addLanguage}
                    className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-50"
                >
                    + Agregar
                </Button>
            </div>

            {/* List */}
            <SortableList ids={ids} onMove={(from, to) => move(from, to)}>
                <div className="space-y-3">
                    {fields.map((field, index) => {
                        const current = watch("languages")?.[index];
                        const rowId = String((current?.id ?? field.id) as any);

                        const title =
                            current?.code &&
                                current.code !== "other" &&
                                isCommonLanguage(current.code)
                                ? LANGUAGE_LABELS[current.code]
                                : current?.name?.trim()
                                    ? current.name
                                    : `Idioma ${index + 1}`;

                        const codeValue = (current?.code ?? "english") as LanguageData["code"];
                        const levelValue = (current?.level ?? "basic") as LanguageData["level"];
                        const nameDisabled = codeValue !== "other";

                        return (
                            <SortableRow
                                key={rowId}
                                density="compact"
                                id={rowId}
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
                                    {/* Idioma (code) */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Idioma</Label>

                                        <Select
                                            value={String(codeValue)}
                                            onValueChange={(v) => {
                                                const code = v as LanguageData["code"];

                                                setValue(`languages.${index}.code`, code, {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                });

                                                if (code !== "other" && isCommonLanguage(code)) {
                                                    setValue(
                                                        `languages.${index}.name`,
                                                        LANGUAGE_LABELS[code],
                                                        { shouldValidate: true, shouldDirty: true }
                                                    );
                                                } else {
                                                    setValue(`languages.${index}.name`, "", {
                                                        shouldValidate: true,
                                                        shouldDirty: true,
                                                    });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className={cvEditorStyles.input}>
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
                                    </div>

                                    {/* Nombre (solo si other) */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Nombre</Label>
                                        <Input
                                            {...register(`languages.${index}.name` as const, {
                                                setValueAs: (v) => (typeof v === "string" ? v : ""),
                                            })}
                                            placeholder="Ej: Japonés"
                                            disabled={nameDisabled}
                                            className={[
                                                cvEditorStyles.input,
                                                nameDisabled
                                                    ? "opacity-70 cursor-not-allowed bg-slate-900/60 text-slate-300"
                                                    : "",
                                            ].join(" ")}
                                        />
                                        {nameDisabled && (
                                            <p className="text-xs text-slate-500">
                                                Para editar el nombre, elegí “Otro”.
                                            </p>
                                        )}
                                    </div>

                                    {/* Nivel */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Nivel</Label>

                                        <Select
                                            value={String(levelValue)}
                                            onValueChange={(v) => {
                                                setValue(`languages.${index}.level`, v as any, {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                });
                                            }}
                                        >
                                            <SelectTrigger className={cvEditorStyles.input}>
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
                                    </div>

                                    {/* Certificación */}
                                    <div className={cvEditorStyles.block}>
                                        <Label className={cvEditorStyles.label}>Certificación</Label>
                                        <Input
                                            {...register(`languages.${index}.certification` as const, {
                                                setValueAs: normalizeOptional, // ✅ opcional real
                                            })}
                                            placeholder="Ej: IELTS 7.0 (2024) · CAE (C1) · DELF B2"
                                            className={cvEditorStyles.input}
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Opcional. Poné examen + nivel/puntaje + año, si aplica.
                                        </p>
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {!hasAny && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                            No hay idiomas todavía. Tocá{" "}
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
                    onClick={addLanguage}
                    className="h-9 px-3 text-xs border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                >
                    + Agregar idioma
                </Button>

                {hasErrors && (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                        Hay errores en la sección de idiomas.
                    </div>
                )}
            </div>
        </div>
    );
}









