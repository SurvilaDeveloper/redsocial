// src/components/cv/preview/ProjectsPreview.tsx
"use client";

import type { ProjectData } from "@/types/cv";

export interface ProjectsPreviewProps {
    data: ProjectData[];
}

export function ProjectsPreview({ data }: ProjectsPreviewProps) {
    const projects = (data ?? []).filter(
        (p) =>
            (p.name?.trim()?.length ?? 0) > 0 ||
            (p.description?.trim()?.length ?? 0) > 0 ||
            (p.url?.trim()?.length ?? 0) > 0 ||
            (p.startDate?.trim()?.length ?? 0) > 0 ||
            (p.endDate?.trim()?.length ?? 0) > 0
    );

    if (!projects.length) return null;

    return (
        <div className="space-y-4">
            {projects.map((p) => {
                const name = (p.name ?? "").trim();
                const desc = (p.description ?? "").trim();
                const url = (p.url ?? "").trim();
                const start = (p.startDate ?? "").trim();
                const end = (p.endDate ?? "").trim();

                const dateLabel =
                    start || end
                        ? `${start || ""}${end ? ` — ${end}` : ""}`
                        : "";

                return (
                    <div key={p.id} className="cv-item cv-block space-y-1">
                        <div className="cv-row flex flex-wrap items-baseline justify-between gap-2">
                            {name ? (
                                <span className="cv-item-title">{name}</span>
                            ) : null}

                            {dateLabel ? (
                                <span className="cv-date">{dateLabel}</span>
                            ) : null}
                        </div>

                        <div className="cv-block-body space-y-1">
                            {desc ? (
                                <p className="cv-description">{desc}</p>
                            ) : null}

                            {url ? (
                                <a
                                    href={normalizeUrl(url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="cv-description underline underline-offset-2"
                                    title={url}
                                >
                                    {stripProtocol(url)}
                                </a>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function normalizeUrl(url: string) {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
}

function stripProtocol(url: string) {
    return url.replace(/^https?:\/\//, "");
}
