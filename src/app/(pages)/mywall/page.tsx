// src/app/(pages)/mywall/page.tsx

import PostList from "@/components/custom/postList";
import auth from "@/auth";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";

const MyWallPage = async () => {
    const session = await auth();

    if (!session?.user?.id) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-sm text-slate-200 bg-slate-900/80 px-4 py-2 rounded-lg">
                    Debes iniciar sesión
                </p>
            </div>
        );
    }

    const userId = Number(session.user.id);

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
        md:min-w-[400px]
        md:w-full
            "
        >
            {/* Header */}
            <header className="w-full py-3 md:py-4 border-b border-slate-800 mb-2">
                <h1 className="flex flex-col items-center text-lg md:text-2xl font-semibold w-full">
                    Mi muro
                </h1>
            </header>

            {/* Aside izquierdo: sólo en pantallas grandes */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={session}></AsideLeft>
            </aside>

            {/* Columna central de posts */}
            <div className="w-full max-w-[720px] py-0 space-y-4 px-2 md:px-0">
                <PostList session={session} userId={userId} viewerType="owner" comingFrom="mywall" />
            </div>


            {/* Aside derecho: sólo en pantallas grandes */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={session}></AsideRight>
            </aside>
        </div>

    );
};

export default MyWallPage;

// reescrita




