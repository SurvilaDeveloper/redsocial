//src/components/site-templates/TemplateContactSection.tsx
"use client";

import { Card } from "@/components/ui/card";

export function TemplateContactSection() {
    return (
        <Card className="bg-slate-950 border-slate-800 p-5 rounded-2xl">
            <div className="text-sm text-slate-300">Contacto (demo)</div>
            <p className="mt-2 text-sm text-slate-400">
                Este es un template ficticio. El formulario real se habilita cuando el usuario aplica el template a su negocio.
            </p>
        </Card>
    );
}
