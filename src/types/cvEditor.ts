// src/types/cvEditor.ts

import { CVContent } from "@/types/cv";

export type EditorCV = {
    id: number | null;
    title: string;
    summary: string;
    birthDate?: string | null; // "YYYY-MM-DD" (solo UI)
    content: CVContent;
    imageUrl?: string | null;
    imagePublicId?: string | null;
};