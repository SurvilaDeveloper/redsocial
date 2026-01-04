// src/components/cv/preview/LanguagePreview.tsx

import { LanguageData } from "@/types/cv";
import { LANGUAGE_LABELS } from "@/types/cvLanguages";

export function LanguagesPreview({ data }: { data: LanguageData[] }) {
    if (!data.length) return null;

    return (
        <section>
            <h3 className="text-lg font-semibold">Idiomas</h3>

            <ul className="mt-2 space-y-1">
                {data.map((lang, i) => (
                    <li
                        key={i}
                        className="flex justify-between"
                    >
                        <span>
                            {lang.code !== "other"
                                ? LANGUAGE_LABELS[lang.code]
                                : lang.name}
                        </span>
                        <span className="capitalize text-muted-foreground">
                            {lang.level}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

