// src/app/(pages)/trash/page.tsx

import { auth } from "@/auth";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";
import TrashPageClient from "./TrashPageClient";

export default async function TrashPage() {
    const session = await auth();

    if (!session?.user?.id) {
        // Si no hay sesión, bloqueamos acceso a la papelera
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-sm text-slate-200 bg-slate-900/80 px-4 py-2 rounded-lg">
                    Debes iniciar sesión para ver la papelera de reciclaje.
                </p>
            </div>
        );
    }

    return (
        <div
            className="
flex 
        flex-col 
        min-h-[calc(100vh-3.5rem)]  /* aprox alto disponible bajo la navbar en mobile */
        md:min-h-[calc(100vh-4rem)]
        text-slate-100
        w-full
        md:max-w-[33%]
        md:min-w-[500px]
        md:w-full
            "
        >
            {/* Header */}
            <header className="w-full py-3 md:py-4 border-b border-slate-800 mb-2">
                <h1 className="flex flex-col items-center text-lg md:text-2xl font-semibold w-full">
                    Papelera de reciclaje
                </h1>
            </header>

            {/* Layout principal: asides + contenido central */}
            {/* Aside izquierdo: sólo desktop */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={session}>
                    {/* Si querés algo especial para la papelera, lo ponés acá */}
                </AsideLeft>
            </aside>

            {/* Contenido central */}
            <div className="w-full max-w-[720px] py-0 space-y-4 px-2 md:px-0">
                <TrashPageClient />
            </div>

            {/* Aside derecho: sólo desktop ancho */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={session}>
                    {/* Lugar para info extra sobre la papelera, futuro */}
                </AsideRight>
            </aside>
        </div>

    );
}

// reescrita
