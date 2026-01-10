// src/components/cv/preview/ExperiencePreview.tsx
import type { ExperienceData, ExperienceItem } from "@/types/cv";

type Props = {
    data: ExperienceData;
};

export function ExperiencePreview({ data }: Props) {
    const items: ExperienceItem[] = Array.isArray(data) ? data : [];

    if (items.length === 0) return null;

    const visible = items
        .map((e) => ({
            ...e,
            items: Array.isArray(e.items) ? e.items : [],
        }))
        .filter((e) => {
            const hasBullets = e.items.some((x) => (x ?? "").trim().length > 0);
            return (
                (e.role ?? "").trim().length > 0 ||
                (e.company ?? "").trim().length > 0 ||
                (e.description ?? "").trim().length > 0 ||
                (e.startDate ?? "").trim().length > 0 ||
                (e.endDate ?? "").trim().length > 0 ||
                hasBullets
            );
        });

    if (visible.length === 0) return null;

    return (
        <div className="space-y-4">
            {visible.map((exp) => {
                const role = (exp.role ?? "").trim() ? exp.role : "Rol";
                const company = (exp.company ?? "").trim();
                const start = (exp.startDate ?? "").trim();
                const end = (exp.endDate ?? "").trim();
                const desc = (exp.description ?? "").trim();

                const bullets = (exp.items ?? []).filter(
                    (x) => (x ?? "").trim().length > 0
                );

                const dateLabel =
                    start || end
                        ? `${start || ""}${end ? ` — ${end}` : start ? " — Actual" : ""}`
                        : "";

                return (
                    <div key={exp.id} className="cv-item cv-block space-y-1">
                        <div className="cv-row flex flex-wrap items-baseline justify-between gap-2">
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="cv-item-title">{role}</span>

                                {company ? (
                                    <span className="cv-item-subtitle">· {company}</span>
                                ) : null}
                            </div>

                            {dateLabel ? (
                                <div className="cv-date">{dateLabel}</div>
                            ) : null}
                        </div>

                        <div className="cv-block-body space-y-1">
                            {desc ? (
                                <p className="cv-description">{desc}</p>
                            ) : null}

                            {bullets.length > 0 ? (
                                <ul className="list-disc ml-5 space-y-1">
                                    {bullets.map((b, i) => (
                                        <li
                                            key={`${exp.id}-b-${i}`}
                                            className="cv-description"
                                        >
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

