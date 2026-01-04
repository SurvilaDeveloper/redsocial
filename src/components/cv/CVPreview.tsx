// src/components/cv/CVPreview.tsx

import { EditorCV } from "@/types/cvEditor";
import { ExperiencePreview } from "./preview/ExperiencePreview";
import { EducationPreview } from "./preview/EducationPreview";
import { SkillsPreview } from "./preview/SkillsPreview";
import { LanguagesPreview } from "./preview/LanguagesPreview";
import { ProjectsPreview } from "./preview/ProjectsPreview";
import { ExperienceData, EducationData, SkillData, LanguageData, ProjectData } from "@/types/cv";


interface Props {
    cv: EditorCV;
}

export function CVPreview({ cv }: Props) {
    const sections = cv.content?.sections ?? [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="border-b pb-4">
                <h1 className="text-3xl font-bold">{cv.title}</h1>
                {cv.summary && (
                    <p className="text-muted-foreground mt-2">
                        {cv.summary}
                    </p>
                )}
            </header>

            {/* Sections */}
            <div className="space-y-6">
                {sections.map((section) => {
                    switch (section.type) {
                        case "experience":
                            return (
                                <ExperiencePreview
                                    key={section.id}
                                    data={section.data as ExperienceData}
                                />
                            );

                        case "education":
                            return (
                                <EducationPreview
                                    key={section.id}
                                    data={section.data as EducationData}
                                />
                            );

                        case "skills":
                            return (
                                <SkillsPreview
                                    key={section.id}
                                    data={section.data as SkillData[]}
                                />
                            );

                        case "languages":
                            return (
                                <LanguagesPreview
                                    key={section.id}
                                    data={section.data as LanguageData[]}
                                />
                            );

                        case "projects":
                            return (
                                <ProjectsPreview
                                    key={section.id}
                                    data={section.data as ProjectData[]}
                                />
                            );

                        default:
                            return null;
                    }
                })}
            </div>
        </div>
    );
}

