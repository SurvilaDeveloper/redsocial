//src/components/business/BusinessActiveToggle.tsx
"use client";

import { useTransition } from "react";

export function BusinessActiveToggle({ businessId, status }: { businessId: number; status: string | null }) {
    const [pending, start] = useTransition();
    const statusButton = (status === 'active' ? true : false);

    return (
        <div className="flex flex-col items-center justify-center gap-2 border border-slate-700  p-2">
            <span className={statusButton ? "text-green-600  text-[14px]" : "text-red-700  text-[14px]"}>
                {statusButton ? 'Este sito es público' : 'Este sitio no es público'}
            </span>
            <button
                type="button"
                disabled={pending}
                onClick={() => {
                    start(async () => {
                        const res = await fetch(`/api/studio/business/${businessId}/status`, { method: "PATCH" });
                        if (!res.ok) alert("No se pudo cambiar el estado.");
                        // refresca la página actual
                        window.location.reload();
                    });
                }}
                className={[
                    "px-3 py-2 text-sm rounded-xl border", "border-slate-500/40 bg-slate-600/15 text-slate-200 hover:bg-slate-600/20",
                    pending ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
                title={statusButton ? "Poner en modo 'borrador' para poder editar" : "Hacer el sitio público"}
            >
                {pending ? "..." : statusButton ? "Pasar a modo borrador" : "Publicar"}
            </button>

        </div>

    );
}
