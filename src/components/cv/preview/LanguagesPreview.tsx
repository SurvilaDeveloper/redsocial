// src/components/cv/preview/LanguagesPreview.tsx
import type { LanguageData } from "@/types/cv";
import { LANGUAGE_LABELS } from "@/types/cvLanguages";

type Props = {
    data: LanguageData[];
};

export function LanguagesPreview({ data }: Props) {
    const langs = (data ?? []).filter(
        (l) => l.code !== "other" || (l.name?.trim()?.length ?? 0) > 0
    );

    if (!langs.length) return null;

    return (
        <ul className="space-y-1">
            {langs.map((lang) => {
                const name =
                    lang.code !== "other"
                        ? LANGUAGE_LABELS[lang.code]
                        : lang.name?.trim();

                if (!name) return null;

                return (
                    <li
                        key={lang.id}
                        className="cv-item cv-row flex items-baseline justify-between gap-3"
                    >
                        <div className="flex flex-wrap items-baseline gap-2">
                            <span className="cv-item-title">{name}</span>

                            {lang.certification ? (
                                <span className="cv-item-subtitle">
                                    · {lang.certification}
                                </span>
                            ) : null}
                        </div>

                        {lang.level ? (
                            <span className="cv-item-subtitle capitalize">
                                {lang.level}
                            </span>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}
