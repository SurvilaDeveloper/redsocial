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
                min-h-[calc(100vh-3.5rem)]  /* resto de la altura bajo la navbar (aprox) */
                md:min-h-[calc(100vh-4rem)]
                text-slate-100
            "
        >
            {/* Header del muro */}
            <header className="w-full py-3 md:py-4 border-b border-slate-800 mb-2">
                <h1 className="flex flex-col items-center text-lg md:text-2xl font-semibold w-full">
                    Mi muro
                </h1>
            </header>

            {/* Layout principal: asides + columna central */}
            <div className="flex flex-1 w-full gap-4">
                {/* Aside izquierdo: sólo en pantallas grandes */}
                <aside className="hidden lg:block w-[220px] xl:w-[260px]">
                    <AsideLeft><></></AsideLeft>
                </aside>

                {/* Columna central de posts */}
                <main className="w-full flex-1 flex justify-center">
                    <div className="w-full max-w-[720px] py-3">
                        <PostList session={session} userId={userId} />
                    </div>
                </main>

                {/* Aside derecho: sólo en pantallas grandes */}
                <aside className="hidden xl:block w-[260px]">
                    <AsideRight><></></AsideRight>
                </aside>
            </div>
        </div>
    );
};

export default MyWallPage;





