// src/components/cv/preview/CustomPreview.tsx
import type { CustomData } from "@/types/cv";

type Props = {
    data: CustomData;
};

export function CustomPreview({ data }: Props) {
    const visibleItems = (data.items ?? []).filter(
        (it) =>
            (it.title?.trim()?.length ?? 0) > 0 ||
            (it.subtitle?.trim()?.length ?? 0) > 0 ||
            (it.description?.trim()?.length ?? 0) > 0 ||
            (it.date?.trim()?.length ?? 0) > 0 ||
            (it.url?.trim()?.length ?? 0) > 0
    );

    if (!visibleItems.length) return null;

    return (
        <div className="space-y-4">
            {visibleItems.map((item) => {
                const title = (item.title ?? "").trim();
                const subtitle = (item.subtitle ?? "").trim();
                const desc = (item.description ?? "").trim();
                const date = (item.date ?? "").trim();
                const url = (item.url ?? "").trim();

                return (
                    <div key={item.id} className="cv-item cv-block space-y-1">
                        <div className="cv-row flex flex-wrap items-baseline justify-between gap-2">
                            <div className="flex flex-wrap items-baseline gap-2">
                                {title ? (
                                    <span className="cv-item-title">{title}</span>
                                ) : null}

                                {subtitle ? (
                                    <span className="cv-item-subtitle">· {subtitle}</span>
                                ) : null}
                            </div>

                            {date ? (
                                <span className="cv-date">{date}</span>
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
