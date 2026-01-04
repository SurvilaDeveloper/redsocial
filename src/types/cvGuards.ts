// src/types/cvGuards.ts

import { CVSection } from "@/types/cv";

export function isExperienceSection(
    section: CVSection
): section is CVSection<"experience"> {
    return section.type === "experience";
}

export function isEducationSection(
    section: CVSection
): section is CVSection<"education"> {
    return section.type === "education";
}

export function isSkillsSection(
    section: CVSection
): section is CVSection<"skills"> {
    return section.type === "skills";
}

export function isLanguagesSection(
    section: CVSection
): section is CVSection<"languages"> {
    return section.type === "languages";
}

// ✅ Nuevo guard para projects
export function isProjectsSection(
    section: CVSection
): section is CVSection<"projects"> {
    return section.type === "projects";
}
