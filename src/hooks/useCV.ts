// src/hooks/useCV.ts
import { useEffect, useState } from "react";
import type { Curriculum, CVContent } from "@/types/cv";
import { EditorCV } from "@/types/cvEditor";
import { CVSection } from "@/types/cv";

function normalizeSections(
    sections: CVSection[] | undefined
): CVSection[] {
    if (!Array.isArray(sections)) return [];

    return sections.map((section) => {
        switch (section.type) {
            case "experience":
                return {
                    ...section,
                    data: {
                        company: section.data?.company ?? "",
                        role: section.data?.role ?? "",
                        startDate: section.data?.startDate ?? "",
                        endDate: section.data?.endDate,
                        description: section.data?.description ?? "",
                    },
                };

            case "education":
                return {
                    ...section,
                    data: {
                        institution: section.data?.institution ?? "",
                        degree: section.data?.degree ?? "",
                        startDate: section.data?.startDate ?? "",
                        endDate: section.data?.endDate,
                        description: section.data?.description ?? "",
                    },
                };

            case "skills":
                return {
                    ...section,
                    data: Array.isArray(section.data)
                        ? section.data.map((s) => ({
                            name: s.name ?? "",
                            level: s.level ?? "basic",
                        }))
                        : [],
                };

            default:
                return section;
        }
    });
}


function normalizeCV(cv: any): Curriculum {
    return {
        id: cv.id,
        userId: cv.userId,
        title: cv.title || "Mi CV",
        summary: cv.summary ?? "",
        content: {
            sections: normalizeSections(cv.content?.sections),
        },
        isPublic: cv.isPublic ?? false,
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
    };
}


export function useCV(cvId: number | null) {
    const [cv, setCV] = useState<EditorCV | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (cvId === null) {
            setCV({
                id: null,
                title: "Nuevo CV",
                summary: "",
                content: { sections: [] },
            });
            setLoading(false);
            return;
        }

        fetch(`/api/cv/${cvId}`)
            .then(res => res.json())
            .then(data => {
                setCV({
                    id: data.cv.id,
                    title: data.cv.title,
                    summary: data.cv.summary ? data.cv.summary : "",
                    content: normalizeCV(data.cv).content,
                });
                setLoading(false);
            });
    }, [cvId]);

    const save = async (updated: EditorCV) => {
        const payload = {
            ...updated,
            summary: updated.summary ?? "",
            title: updated.title || "Mi CV",
            content: {
                sections: normalizeSections(updated.content?.sections),
            },
        };

        const res = await fetch(
            payload.id === null ? "/api/cv" : `/api/cv/${payload.id}`,
            {
                method: payload.id === null ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        const text = await res.text();
        console.log("API RESPONSE:", res.status, text);

        if (!res.ok) {
            throw new Error("Save failed");
        }

        const data = JSON.parse(text);

        setCV({
            id: data.cv.id,
            title: data.cv.title,
            summary: data.cv.summary ?? "",
            content: {
                sections: normalizeSections(data.cv.content?.sections),
            },
        });

        return data.cv;
    };



    return { cv, setCV, save, loading };
}



