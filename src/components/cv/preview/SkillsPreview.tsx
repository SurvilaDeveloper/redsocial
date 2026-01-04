// src/components/cv/preview/SkillsPreview.tsx

import { SkillData } from "@/types/cv";

export function SkillsPreview({ data }: { data: SkillData[] }) {
    if (!data.length) return null;

    return (
        <section>
            <h2 className="text-lg font-semibold mb-2">
                Skills
            </h2>

            <ul className="grid grid-cols-2 gap-2">
                {data.map((skill, i) => (
                    <li
                        key={i}
                        className="flex justify-between text-sm"
                    >
                        <span>{skill.name}</span>

                        {skill.level && (
                            <span className="text-muted-foreground capitalize">
                                {skill.level}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
