// src/components/cv/sections/ProjectsSectionEditor.tsx
"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { ProjectData } from "@/types/cv";
import { cn } from "@/lib/utils";

type ProjectsSectionEditorProps = {
    value: ProjectData[];
    onChange: (value: ProjectData[]) => void;
};

export function ProjectsSectionEditor({ value, onChange }: ProjectsSectionEditorProps) {
    const form = useForm<{ projects: ProjectData[] }>({
        defaultValues: { projects: value ?? [] },
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "projects",
    });

    // Dispara cambios siempre que cambie cualquier campo
    useEffect(() => {
        const subscription = form.watch((values) => {
            const projects: ProjectData[] = (values.projects ?? []).map((p) => ({
                id: p?.id ?? crypto.randomUUID(),
                name: p?.name ?? "",
                description: p?.description ?? "",
                url: p?.url ?? "",
                startDate: p?.startDate ?? "",
                endDate: p?.endDate ?? "",
            }));

            onChange(projects);
        });
        return () => subscription.unsubscribe();
    }, [form, onChange]);


    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="rounded-md border p-4 space-y-2">
                    <input
                        {...form.register(`projects.${index}.name`)}
                        placeholder="Nombre del proyecto"
                        className={cn("input bg-black text-white")}
                    />
                    <input
                        {...form.register(`projects.${index}.description`)}
                        placeholder="Descripción"
                        className={cn("input bg-black text-white")}
                    />
                    <input
                        {...form.register(`projects.${index}.url`)}
                        placeholder="URL (opcional)"
                        className={cn("input bg-black text-white")}
                    />
                    <div className="flex gap-2">
                        <input
                            {...form.register(`projects.${index}.startDate`)}
                            type="date"
                            className="input bg-black text-white"
                        />
                        <input
                            {...form.register(`projects.${index}.endDate`)}
                            type="date"
                            className="input bg-black text-white"
                        />
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => remove(index)}>
                        Eliminar
                    </Button>
                </div>
            ))}

            <Button
                type="button"
                onClick={() =>
                    append({
                        id: crypto.randomUUID(),
                        name: "",
                        description: "",
                        url: "",
                        startDate: "",
                        endDate: "",
                    })
                }
            >
                + Agregar proyecto
            </Button>
        </div>
    );
}

