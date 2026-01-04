//src/components/cv/preview/EducationPreview.tsx

import { EducationData } from "@/types/cv";

export function EducationPreview({ data }: { data: EducationData }) {
    return (
        <section>
            <h2 className="text-lg font-semibold">
                {data.degree}
            </h2>

            <p className="text-sm">
                {data.institution}
            </p>

            <p className="text-sm text-muted-foreground">
                {data.startDate}
                {data.endDate ? ` — ${data.endDate}` : ""}
            </p>

            {data.description && (
                <p className="mt-2 text-sm">
                    {data.description}
                </p>
            )}
        </section>
    );
}
