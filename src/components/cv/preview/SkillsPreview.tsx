// src/components/cv/preview/SkillsPreview.tsx
import type { SkillData } from "@/types/cv";

const LEVEL_LABELS: Record<NonNullable<SkillData["level"]>, string> = {
    basic: "Básico",
    intermediate: "Intermedio",
    advanced: "Avanzado",
    expert: "Experto",
};

type Props = {
    data: SkillData[];
};

export function SkillsPreview({ data }: Props) {
    const visible = (data ?? []).filter((s) => (s.name ?? "").trim().length > 0);
    if (!visible.length) return null;

    const order: Record<NonNullable<SkillData["level"]>, number> = {
        expert: 0,
        advanced: 1,
        intermediate: 2,
        basic: 3,
    };

    const sorted = [...visible].sort((a, b) => {
        const la = a.level ?? "basic";
        const lb = b.level ?? "basic";
        return order[la] - order[lb] || a.name.localeCompare(b.name);
    });

    return (
        <div className="cv-row flex flex-wrap gap-2">
            {sorted.map((s) => (
                <span
                    key={s.id}
                    className="cv-item inline-flex items-center gap-2 rounded-full border px-3 py-1"
                >
                    <span className="cv-item-title">{s.name}</span>

                    {s.level ? (
                        <span className="cv-item-subtitle">
                            {LEVEL_LABELS[s.level]}
                        </span>
                    ) : null}
                </span>
            ))}
        </div>
    );
}





