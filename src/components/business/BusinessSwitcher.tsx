// src/components/business/BusinessSwitcher.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BusinessOption = {
    id: number;
    name: string;
    slug: string;
};

export function BusinessSwitcher({
    businesses,
    initialBusinessId,
    mode = "studio",
}: {
    businesses: BusinessOption[];
    initialBusinessId?: number | null;
    mode?: "studio" | "public";
}) {
    const router = useRouter();
    const [value, setValue] = useState<number | "">(
        initialBusinessId ?? (businesses[0]?.id ?? "")
    );

    const sorted = useMemo(() => {
        return [...businesses].sort((a, b) => a.name.localeCompare(b.name));
    }, [businesses]);

    const go = (id: number) => {
        if (mode === "public") {
            const b = businesses.find((x) => x.id === id);
            if (!b) return;
            router.push(`/b/${b.slug}`);
            return;
        }
        router.push(`/studio/business/${id}/home`);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400">Negocio</div>
            <select
                value={value}
                onChange={(e) => {
                    const next = Number(e.target.value);
                    setValue(next);
                    go(next);
                }}
                className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100
                           outline-none focus:ring-2 focus:ring-slate-600"
                title="Seleccionar negocio"
            >
                {sorted.map((b) => (
                    <option key={b.id} value={b.id}>
                        {b.name}
                    </option>
                ))}
            </select>

            {typeof value === "number" && (
                <button
                    type="button"
                    onClick={() => go(value)}
                    className="h-9 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-sm text-slate-200"
                    title="Volver al Home del negocio seleccionado"
                >
                    Volver a Home
                </button>
            )}
        </div>
    );
}
