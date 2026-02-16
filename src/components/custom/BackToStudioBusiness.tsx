// src/components/custom/BackToStudioBusiness.tsx
"use client";

import { useRouter } from "next/navigation";

export default function BackToStudioBusiness({
    fallbackHref = "/studio/business",
    label = "Volver a Studio Business",
}: {
    fallbackHref?: string;
    label?: string;
}) {
    const router = useRouter();

    const goBack = () => {
        // Si hay historial, volvemos (mejor UX)
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }
        router.push(fallbackHref);
    };

    return (
        <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-sm text-slate-200"
            title={label}
        >
            ← {label}
        </button>
    );
}
