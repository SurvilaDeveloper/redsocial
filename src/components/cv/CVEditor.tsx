// src/components/cv/CVEditor.tsx

"use client";

import { useCallback } from "react";
import { useCV } from "@/hooks/useCV";
import { CVSection } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EducationSectionEditor } from "@/components/cv/sections/EducationSectionEditor";
import { ExperienceSectionEditor } from "@/components/cv/sections/ExperienceSectionEditor";
import { SkillsSectionEditor } from "./sections/SkillsSectionEditor";
import { LanguagesSectionEditor } from "./sections/LanguagesSectionEditor";
import { ProjectsSectionEditor } from "./sections/ProjectsSectionEditor";
import {
    isEducationSection,
    isExperienceSection,
    isSkillsSection,
    isLanguagesSection,
    isProjectsSection
} from "@/types/cvGuards";
import { useRouter } from "next/navigation";



function createSection(type: CVSection["type"]): CVSection {
    switch (type) {
        case "experience":
            return {
                id: crypto.randomUUID(),
                type,
                data: {
                    company: "",
                    role: "",
                    startDate: "",
                    description: "",
                },
            };

        case "education":
            return {
                id: crypto.randomUUID(),
                type,
                data: {
                    institution: "",
                    degree: "",
                    startDate: "",
                    description: "",
                },
            };

        case "skills":
            return {
                id: crypto.randomUUID(),
                type: "skills",
                data: [],
            };

        case "languages":
            return {
                id: crypto.randomUUID(),
                type: "languages",
                data: [],
            };

        case "projects":
            return {
                id: crypto.randomUUID(),
                type: "projects",
                data: [],
            };

        default:
            return {
                id: crypto.randomUUID(),
                type,
                data: {},
            };
    }
}

export function CVEditor({ cvId }: { cvId: number | null }) {
    const router = useRouter();
    const { cv, setCV, save, loading } = useCV(cvId);

    const hasSection = (type: CVSection["type"]) => {
        return cv?.content.sections.some(
            (section) => section.type === type
        );
    };


    const addSection = (type: CVSection["type"]) => {
        setCV((prev) => {
            if (!prev) return prev;

            // ⛔ No permitir más de una sección skills, languages o projects
            if (
                (type === "skills" && prev.content.sections.some(s => s.type === "skills")) ||
                (type === "languages" && prev.content.sections.some(s => s.type === "languages")) ||
                (type === "projects" && prev.content.sections.some(s => s.type === "projects"))
            ) {
                return prev;
            }
            return {
                ...prev,
                content: {
                    sections: [...prev.content.sections, createSection(type)],
                },
            };
        });
    };


    const removeSection = useCallback(
        (id: string) => {
            setCV((prev) => {
                if (!prev) return prev;

                return {
                    ...prev,
                    content: {
                        sections: prev.content.sections.filter(
                            (section) => section.id !== id
                        ),
                    },
                };
            });
        },
        [setCV]
    );


    const updateSection = <T extends CVSection["type"]>(
        updated: CVSection<T>
    ) => {
        setCV((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                content: {
                    sections: prev.content.sections.map((s) =>
                        s.id === updated.id ? updated : s
                    ),
                },
            };
        });
    };

    const handleSave = async () => {
        if (!cv) return;

        const saved = await save(cv);

        if (cvId === null) {
            router.replace(`/cv/${saved.id}`);
        }

    };

    if (loading)
        return <p className="text-sm text-muted-foreground">Cargando…</p>;
    if (!cv)
        return <p className="text-sm text-muted-foreground">No encontrado</p>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">{cv.title}</h1>
                {cv.summary && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {cv.summary}
                    </p>
                )}
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {cv.content.sections.map((section) => (
                    <Card key={section.id}>
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <CardTitle className="text-sm capitalize">
                                {section.type}
                            </CardTitle>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeSection(section.id)}
                            >
                                Eliminar
                            </Button>
                        </CardHeader>

                        <CardContent className="pt-0">
                            {isExperienceSection(section) && (
                                <ExperienceSectionEditor
                                    section={section}
                                    onChange={updateSection}
                                />
                            )}

                            {isEducationSection(section) && (
                                <EducationSectionEditor
                                    section={section}
                                    onChange={updateSection}
                                />
                            )}
                            {isSkillsSection(section) && (
                                <SkillsSectionEditor
                                    section={section}
                                    onChange={updateSection}
                                />
                            )}

                            {isLanguagesSection(section) && (
                                <LanguagesSectionEditor
                                    value={section.data}
                                    onChange={(data) =>
                                        updateSection({
                                            ...section,
                                            data,
                                        })
                                    }
                                />
                            )}
                            {isProjectsSection(section) && (
                                <ProjectsSectionEditor
                                    value={section.data}
                                    onChange={(data) =>
                                        updateSection({
                                            ...section,
                                            data
                                        })
                                    }
                                />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add section buttons */}
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => addSection("experience")}>
                    + Experiencia
                </Button>
                <Button variant="outline" onClick={() => addSection("education")}>
                    + Educación
                </Button>
                <Button
                    variant="outline"
                    onClick={() => addSection("skills")}
                    disabled={hasSection("skills")}
                >
                    + Skills
                </Button>
                <Button
                    variant="outline"
                    onClick={() => addSection("languages")}
                    disabled={hasSection("languages")}
                >
                    + Idiomas
                </Button>
                <Button
                    variant="outline"
                    onClick={() => addSection("projects")}
                    disabled={hasSection("projects")}
                >
                    + Proyectos
                </Button>
            </div>

            {/* Save */}
            <div className="pt-4">
                <Button onClick={handleSave}>Guardar CV</Button>
            </div>
        </div>
    );
}


