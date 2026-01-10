// src/components/cv/CVRenderer.tsx
import React from "react";
import type { EditorCV } from "@/types/cvEditor";
import type {
    CVSection,
    ProfileData,
    ExperienceData,
    EducationData,
    SkillData,
    LanguageData,
    ProjectData,
    CustomData,
} from "@/types/cv";

import { HeaderPreview } from "./preview/HeaderPreview";
import ProfilePreview from "./preview/ProfilePreview";
import { ExperiencePreview } from "./preview/ExperiencePreview";
import { EducationPreview } from "./preview/EducationPreview";
import { SkillsPreview } from "./preview/SkillsPreview";
import { LanguagesPreview } from "./preview/LanguagesPreview";
import { ProjectsPreview } from "./preview/ProjectsPreview";
import { CustomPreview } from "./preview/CustomPreview";

type Props = { cv: EditorCV };

export function CVRenderer({ cv }: Props) {
    const sections = cv.content?.sections ?? [];

    const profileSection = sections.find((s) => s.type === "profile") as CVSection<"profile"> | undefined;
    const profileData = (profileSection?.data ?? { fullName: "" }) as ProfileData;

    const rest = sections.filter((s) => s.type !== "profile");

    return (
        <div className="space-y-6">
            <div className="cv-block space-y-6">
                {/* Header: nombre + headline + summary (root) */}
                {profileSection ? (
                    <HeaderPreview
                        profile={profileData}
                        summary={(cv as any).summary ?? ""} // root en Curriculum/EditorCV
                    />
                ) : null}

                {/* Datos personales / contacto / links */}
                {profileSection ? (
                    <ProfilePreview
                        data={profileData}
                        birthDate={(cv as any).birthDate ?? null} // root
                    />
                ) : null}
            </div>
            {/* Resto de secciones */}
            {rest.map((section) => {
                switch (section.type) {
                    case "experience":
                        return (
                            <SectionBlock key={section.id} title="Experiencia">
                                <ExperiencePreview data={section.data as ExperienceData} />
                            </SectionBlock>
                        );

                    case "education":
                        return (
                            <SectionBlock key={section.id} title="Educación">
                                <EducationPreview data={section.data as EducationData} />
                            </SectionBlock>
                        );

                    case "projects":
                        return (
                            <SectionBlock key={section.id} title="Proyectos">
                                <ProjectsPreview data={section.data as ProjectData[]} />
                            </SectionBlock>
                        );

                    case "skills":
                        return (
                            <SectionBlock key={section.id} title="Skills">
                                <SkillsPreview data={section.data as SkillData[]} />
                            </SectionBlock>
                        );

                    case "languages":
                        return (
                            <SectionBlock key={section.id} title="Idiomas">
                                <LanguagesPreview data={section.data as LanguageData[]} />
                            </SectionBlock>
                        );

                    case "custom": {
                        const d = section.data as CustomData;
                        const title = d.title?.trim() || "Sección";
                        return (
                            <SectionBlock key={section.id} title={title}>
                                <CustomPreview data={d} />
                            </SectionBlock>
                        );
                    }

                    default:
                        return null;
                }
            })}
        </div>
    );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="cv-section space-y-3">
            <h2 className="cv-title border-b pb-1">{title}</h2>
            {children}
        </section>
    );
}

