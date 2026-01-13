// src/app/(pages)/cv/[id]/page.client.tsx
"use client";

import { CVEditor } from "@/components/cv/CVEditor";
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
        <div className="w-screen max-w-none px-0 lg:px-4 pb-4 lg:pb-6">
            <CVEditor cvId={cvId} />
        </div>
    );

}


