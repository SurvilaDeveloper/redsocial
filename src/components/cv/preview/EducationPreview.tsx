// src/components/cv/preview/EducationPreview.tsx
import type { EducationData, EducationItem } from "@/types/cv";

type Props = {
    data: EducationData;
};

export function EducationPreview({ data }: Props) {
    const items: EducationItem[] = Array.isArray(data) ? data : [];
    if (items.length === 0) return null;

    const visible = items.filter((e) => {
        const institution = (e.institution ?? "").trim();
        const degree = (e.degree ?? "").trim();
        const start = (e.startDate ?? "").trim();
        const end = (e.endDate ?? "").trim();
        const desc = (e.description ?? "").trim();
        return !!(institution || degree || start || end || desc);
    });

    if (visible.length === 0) return null;

    return (
        <div className="space-y-4">
            {visible.map((e) => {
                const institution = (e.institution ?? "").trim();
                const degree = (e.degree ?? "").trim();
                const start = (e.startDate ?? "").trim();
                const end = (e.endDate ?? "").trim();
                const desc = (e.description ?? "").trim();

                const title = degree || "Título";
                const dateLabel =
                    start || end
                        ? `${start || ""}${end ? ` — ${end}` : start ? " — En curso" : ""}`
                        : "";

                return (
                    <div key={e.id} className="cv-item cv-block space-y-1">
                        <div className="cv-row flex flex-wrap items-baseline justify-between gap-2">
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="cv-item-title">{title}</span>
                                {institution ? (
                                    <span className="cv-item-subtitle">· {institution}</span>
                                ) : null}
                            </div>

                            {dateLabel ? (
                                <span className="cv-date">{dateLabel}</span>
                            ) : null}
                        </div>

                        <div className="cv-block-body space-y-1">
                            {desc ? (
                                <p className="cv-description">{desc}</p>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
