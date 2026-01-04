// src/components/cv/sections/ExperienceSectionEditor.tsx

"use client";

import { CVSection } from "@/types/cv";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
    section: CVSection<"experience">;
    onChange: (section: CVSection<"experience">) => void;
}

export function ExperienceSectionEditor({ section, onChange }: Props) {
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
                <Label>Empresa</Label>
                <Input
                    value={data.company}
                    onChange={(e) => update("company", e.target.value)}
                />
            </div>

            <div>
                <Label>Rol</Label>
                <Input
                    value={data.role}
                    onChange={(e) => update("role", e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                    />
                </div>
            </div>

            <div>
                <Label>Descripción</Label>
                <Textarea
                    value={data.description ?? ""}
                    onChange={(e) => update("description", e.target.value)}
                />
            </div>
        </div>
    );
}

