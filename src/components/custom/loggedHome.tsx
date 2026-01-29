// src/components/custom/loggedhome.tsx
// src/app/(pages)/home/page.tsx
import { getValidatedSession } from "@/lib/auth/getValidatedSession";

import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";

import LastPostsList from "@/components/custom/LastPostsList";

const LoggedHome = async (session: any) => {
    const validated_session = session;

    return (
        <div id="home-page">
            {/* Aside izquierdo */}
            <aside className="hidden lg:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={validated_session.session} />
            </aside>

            {/* Columna central */}
            <div className="w-full max-w-[720px] py-0 space-y-4 px-2 lg:px-0">
                {/* Feed home */}
                <header className="w-full py-3 lg:py-4 border-b border-slate-800 mb-2">
                    <h1 className="flex flex-col items-center text-lg lg:text-2xl font-semibold w-full">
                        Inicio
                    </h1>
                </header>

                <LastPostsList session={validated_session.session} />
            </div>

            {/* Aside derecho */}
            <aside className="hidden lg:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={validated_session.session} />
            </aside>
        </div>
    );
};

export default LoggedHome;


