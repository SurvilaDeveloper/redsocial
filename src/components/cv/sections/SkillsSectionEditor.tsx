// /src/components/cv/sections/SkillsSectionEditor.tsx
"use client";

import { CVSection, SkillData } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function SkillsSectionEditor({
    section,
    onChange,
}: {
    section: CVSection<"skills">;
    onChange: (section: CVSection<"skills">) => void;
}) {
    const skills = Array.isArray(section.data) ? section.data : [];

    const addSkill = () => {
        onChange({
            ...section,
            data: [...skills, { name: "", level: "basic" }],
        });
    };

    const updateSkill = (index: number, skill: SkillData) => {
        const next = [...skills];
        next[index] = skill;
        onChange({ ...section, data: next });
    };

    const removeSkill = (index: number) => {
        onChange({
            ...section,
            data: skills.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="space-y-3">
            {skills.map((skill, i) => (
                <div key={i} className="flex gap-2">
                    <Input
                        value={skill.name}
                        placeholder="Skill"
                        onChange={(e) =>
                            updateSkill(i, {
                                ...skill,
                                name: e.target.value,
                            })
                        }
                    />

                    <Select
                        value={skill.level}
                        onValueChange={(level) =>
                            updateSkill(i, {
                                ...skill,
                                level: level as SkillData["level"],
                            })
                        }
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Nivel" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="intermediate">
                                Intermedio
                            </SelectItem>
                            <SelectItem value="advanced">Avanzado</SelectItem>
                            <SelectItem value="expert">Experto</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSkill(i)}
                    >
                        ✕
                    </Button>
                </div>
            ))}

            <Button size="sm" variant="outline" onClick={addSkill}>
                + Agregar skill
            </Button>
        </div>
    );
}
