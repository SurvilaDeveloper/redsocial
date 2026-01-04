// src/components/cv/sections/EducationSectionEditor.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CVSection } from "@/types/cv";

interface Props {
    section: CVSection<"education">;
    onChange: (section: CVSection<"education">) => void;
}

export function EducationSectionEditor({ section, onChange }: Props) {
    const data = section.data;

    const update = (field: keyof typeof data, value: string) => {
        onChange({
            ...section,
            data: {
                ...data,
                [field]: value,
            },
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Institución</Label>
                <Input
                    value={data.institution}
                    onChange={(e) => update("institution", e.target.value)}
                    placeholder="Universidad de Buenos Aires"
                />
            </div>

            <div>
                <Label>Título / Carrera</Label>
                <Input
                    value={data.degree}
                    onChange={(e) => update("degree", e.target.value)}
                    placeholder="Ingeniería en Sistemas"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <Label>Fecha inicio</Label>
                    <Input
                        type="month"
                        value={data.startDate}
                        onChange={(e) => update("startDate", e.target.value)}
                    />
                </div>

                <div>
                    <Label>Fecha fin</Label>
                    <Input
                        type="month"
                        value={data.endDate ?? ""}
                        onChange={(e) => update("endDate", e.target.value)}
                        placeholder="En curso"
                    />
                </div>
            </div>

            <div>
                <Label>Descripción</Label>
                <Textarea
                    value={data.description ?? ""}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Materias relevantes, logros, promedio, etc."
                />
            </div>
        </div>
    );
}
