//src/components/cv/preview/ExperiencePreview.tsx

import { ExperienceData } from "@/types/cv";

export function ExperiencePreview({ data }: { data: ExperienceData }) {
    return (
        <section>
            <h2 className="text-lg font-semibold">
                {data.role} · {data.company}
            </h2>

            <p className="text-sm text-muted-foreground">
                {data.startDate}
                {data.endDate ? ` — ${data.endDate}` : " — Actual"}
            </p>

            {data.description && (
                <p className="mt-2 text-sm leading-relaxed">
                    {data.description}
                </p>
            )}
        </section>
    );
}
