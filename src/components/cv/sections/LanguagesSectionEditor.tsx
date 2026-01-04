// src/components/cv/sections/LanguagesSectionEditor.tsx
"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { languagesSectionSchema, LANGUAGE_LEVELS } from "@/lib/zod/cv";
import { COMMON_LANGUAGES } from "@/types/cv";
import { LANGUAGE_LABELS } from "@/types/cvLanguages";
import type { LanguageData, CommonLanguage } from "@/types/cv";
import { cn } from "@/lib/utils";

type LanguagesFormValues = {
    languages: LanguageData[];
};

type LanguagesSectionEditorProps = {
    value: LanguageData[];
    onChange: (value: LanguageData[]) => void;
};

function isCommonLanguage(value: string): value is CommonLanguage {
    return value in LANGUAGE_LABELS;
}

export function LanguagesSectionEditor({
    value,
    onChange,
}: LanguagesSectionEditorProps) {
    const form = useForm<LanguagesFormValues>({
        resolver: zodResolver(z.object({ languages: languagesSectionSchema })),
        defaultValues: { languages: value ?? [] },
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "languages",
    });

    const watchedLanguages = useWatch({ control: form.control, name: "languages" });

    // 🔄 Sincroniza cambios al CVEditor
    useEffect(() => {
        const subscription = form.watch((values) => {
            const result = languagesSectionSchema.safeParse(values.languages);
            if (result.success) onChange(result.data);
        });
        return () => subscription.unsubscribe();
    }, [form, onChange]);

    // 🔄 Actualiza `name` automáticamente para idiomas comunes
    useEffect(() => {
        watchedLanguages?.forEach((lang, index) => {
            if (lang?.code && lang.code !== "other") {
                const expected = LANGUAGE_LABELS[lang.code as CommonLanguage];
                if (lang.name !== expected) {
                    form.setValue(`languages.${index}.name`, expected, { shouldValidate: true });
                }
            }
        });
    }, [watchedLanguages, form]);

    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="rounded-md border p-4 space-y-3">
                    {/* Idioma */}
                    <select
                        {...form.register(`languages.${index}.code`)}
                        onChange={(e) => {
                            const code = e.target.value as LanguageData["code"];
                            form.setValue(`languages.${index}.code`, code);
                            if (isCommonLanguage(code)) {
                                form.setValue(`languages.${index}.name`, LANGUAGE_LABELS[code]);
                            } else {
                                form.setValue(`languages.${index}.name`, "");
                            }
                        }}
                        className="w-full bg-black text-white border border-gray-700 p-2 rounded"
                    >
                        <option value="">Idioma</option>
                        {COMMON_LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>
                                {LANGUAGE_LABELS[lang]}
                            </option>
                        ))}
                        <option value="other">Otro</option>
                    </select>

                    {/* Nombre */}
                    <input
                        {...form.register(`languages.${index}.name`)}
                        placeholder="Idioma"
                        disabled={watchedLanguages?.[index]?.code !== "other"}
                        className={cn(
                            "w-full p-2 rounded border border-gray-700",
                            "bg-black text-white",
                            watchedLanguages?.[index]?.code !== "other" &&
                            "bg-gray-800 text-gray-400 cursor-not-allowed"
                        )}
                    />

                    {/* Nivel */}
                    <select
                        {...form.register(`languages.${index}.level`)}
                        className="w-full bg-black text-white border border-gray-700 p-2 rounded"
                    >
                        <option value="">Nivel</option>
                        {LANGUAGE_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>

                    {/* Certificación */}
                    <input
                        {...form.register(`languages.${index}.certification`)}
                        placeholder="Certificación (opcional)"
                        className="w-full p-2 rounded border border-gray-700 bg-black text-white"
                    />

                    {/* Eliminar */}
                    <button
                        type="button"
                        onClick={() => remove(index)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Eliminar
                    </button>
                </div>
            ))}

            {/* Agregar idioma */}
            <button
                type="button"
                onClick={() =>
                    append({
                        id: crypto.randomUUID(),
                        code: "english",
                        name: LANGUAGE_LABELS.english,
                        level: "basic",
                        certification: "",
                    })
                }
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
                + Agregar idioma
            </button>
        </div>
    );
}





