// src/app/(pages)/cv/[id]/page.client.tsx
"use client";

import { CVEditor } from "@/components/cv/CVEditor";
import { CVPreview } from "@/components/cv/CVPreview";
import { useCV } from "@/hooks/useCV";

export function CVPageClient({ cvId }: { cvId: number | null }) {
    const { cv, loading } = useCV(cvId);

    if (loading || !cv) {
        return (
            <div className="p-8 text-sm text-muted-foreground">
                Cargando CV…
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <CVEditor cvId={cvId} />
                <CVPreview cv={cv} />
            </div>
        </div>
    );
}


