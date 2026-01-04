// src/types/cvEditor.ts

import { CVContent } from "@/types/cv";

export type EditorCV = {
    id: number | null;      // null = no persistido
    title: string;
    summary: string;
    content: CVContent;
};
