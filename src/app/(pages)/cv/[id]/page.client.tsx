// src/app/(pages)/cv/[id]/page.client.tsx
"use client";

import { CVEditor } from "@/components/cv/CVEditor";
import { useCV } from "@/hooks/useCV";
import type { InitialUserCV } from "@/types/initialUserCV";

export function CVPageClient({ cvId, initialUser }: { cvId: number | null; initialUser?: InitialUserCV | null }) {
    const { cv, loading } = useCV(cvId);

    if (loading || !cv) {
        return (
            <div className="p-8 text-sm text-muted-foreground">
                Cargando CV…
            </div>
        );
    }

    return (
        <div className="flex flex-col w-screen max-w-none px-0 lg:px-4 pb-4 lg:pb-6">

            <CVEditor cvId={cvId} initialUser={initialUser} />
        </div>
    );

}


