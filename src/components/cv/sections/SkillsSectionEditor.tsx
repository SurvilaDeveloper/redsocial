// src/components/cv/sections/SkillsSectionEditor.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
//import { useForm, useFieldArray } from "react-hookform";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { CVSection, SkillData } from "@/types/cv";
import { skillsSectionSchema } from "@/lib/zod/cv";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { SortableList } from "@/components/cv/dnd/SortableList";
import { SortableRow } from "@/components/cv/dnd/SortableRow";

import {
    cvEditorStyles,
    normalizeOptional,
} from "@/components/cv/styles/editorStyles";

/**
 * Factory para crear skills con id estable
 */
const createSkill = (): SkillData => ({
    id: crypto.randomUUID(),
    name: "",
    level: "basic",
});

type Props = {
    section: CVSection<"skills">; // data: SkillData[]
    onChange: (section: CVSection<"skills">) => void;
};

type FormValues = {
    skills: SkillData[];
};

export function SkillsSectionEditor({ section, onChange }: Props) {
    const defaultValues = useMemo<FormValues>(() => {
        return { skills: Array.isArray(section.data) ? section.data : [] };
    }, [section.id]);

    const form = useForm<FormValues>({
        resolver: zodResolver(z.object({ skills: skillsSectionSchema })),
        defaultValues,
        mode: "onChange",
        shouldUnregister: false,
    });

    const { control, register, watch, reset, setValue, formState } = form;

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "skills",
    });

    // ✅ Flag anti-loop: cuando hacemos reset, no propagamos watch->onChange
    const isResettingRef = useRef(false);

    // ✅ externo -> form (SOLO cuando cambia la sección)
    useEffect(() => {
        isResettingRef.current = true;

        reset(defaultValues, { keepDirty: false, keepTouched: false });

        queueMicrotask(() => {
            isResettingRef.current = false;
        });
    }, [defaultValues, reset]);

    // ✅ form -> externo (NO bloqueamos por schema para preview reactivo)
    useEffect(() => {
        const sub = watch((values) => {
            if (isResettingRef.current) return;

            const next: SkillData[] = (values.skills ?? []).map((s) => ({
                id: s?.id ?? crypto.randomUUID(),
                name: (s?.name ?? "").trimStart(), // 👈 evita espacios al inicio
                level: (s?.level ?? "basic") as SkillData["level"],
            }));

            onChange({ ...section, data: next });
        });

        return () => sub.unsubscribe();
    }, [watch, onChange, section]);

    const addSkill = () => append(createSkill());

    // ids para dnd (preferimos el id real del item)
    const ids = (watch("skills") ?? []).map((it, idx) =>
        String(it?.id ?? fields[idx]?.id)
    );

    const hasAny = fields.length > 0;
    const hasErrors = Object.keys(formState.errors ?? {}).length > 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-100">Skills</h3>
                    <p className="text-xs text-slate-400">
                        Agregá tus habilidades y definí el nivel. Podés reordenar arrastrando.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={addSkill}
                    className="h-9 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-slate-50"
                >
                    + Agregar
                </Button>
            </div>

            {/* List */}
            <SortableList ids={ids} onMove={(from, to) => move(from, to)}>
                <div className="space-y-3">
                    {fields.map((field, i) => {
                        const current = watch("skills")?.[i];
                        const rowId = String((current?.id ?? field.id) as any);

                        const nameErr = (formState.errors as any)?.skills?.[i]?.name?.message as
                            | string
                            | undefined;
                        const levelErr = (formState.errors as any)?.skills?.[i]?.level?.message as
                            | string
                            | undefined;

                        return (
                            <SortableRow
                                key={rowId}
                                density="compact"
                                id={rowId}
                                title={
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-100">
                                            Skill {i + 1}
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
                                        onClick={() => remove(i)}
                                        className="h-8 px-2 text-xs border-red-500/50 text-red-200 bg-red-950/30 hover:bg-red-900/40 hover:text-red-100"
                                        aria-label="Eliminar skill"
                                        title="Eliminar"
                                    >
                                        Eliminar
                                    </Button>
                                }
                            >
                                <div className="space-y-4">
                                    <div className={cvEditorStyles.grid2}>
                                        {/* Nombre */}
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Nombre</Label>
                                            <Input
                                                className={cvEditorStyles.input}
                                                placeholder="Ej: React, TypeScript, SQL..."
                                                {...register(`skills.${i}.name` as const)}
                                            />
                                            {nameErr && <p className="text-xs text-red-400">{nameErr}</p>}
                                            {!nameErr && (
                                                <p className="text-[11px] text-slate-500">
                                                    Tip: evitá repetir skills (React vs react).
                                                </p>
                                            )}
                                        </div>

                                        {/* Nivel */}
                                        <div className={cvEditorStyles.block}>
                                            <Label className={cvEditorStyles.label}>Nivel</Label>

                                            <Select
                                                value={String(current?.level ?? "basic")}
                                                onValueChange={(v) => {
                                                    setValue(`skills.${i}.level`, v as any, {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className={cvEditorStyles.input}>
                                                    <SelectValue placeholder="Nivel" />
                                                </SelectTrigger>

                                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                                                    <SelectItem value="basic">Básico</SelectItem>
                                                    <SelectItem value="intermediate">Intermedio</SelectItem>
                                                    <SelectItem value="advanced">Avanzado</SelectItem>
                                                    <SelectItem value="expert">Experto</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {levelErr && <p className="text-xs text-red-400">{levelErr}</p>}
                                        </div>
                                    </div>
                                </div>
                            </SortableRow>
                        );
                    })}

                    {!hasAny && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                            No hay skills todavía. Tocá{" "}
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
                    onClick={addSkill}
                    className="h-9 px-3 text-xs border-emerald-500/60 text-emerald-100 bg-emerald-900/20 hover:bg-emerald-900/35 hover:text-emerald-50"
                >
                    + Agregar skill
                </Button>

                {hasErrors && (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                        Hay errores en la sección de skills.
                    </div>
                )}
            </div>
        </div>
    );
}