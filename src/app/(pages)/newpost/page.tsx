// src/app/(pages)/newpost/page.tsx

import auth from "@/auth";
import CreatePostForm from "@/components/custom/createPostForm";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";

const NewPostPage = async () => {
    const session = await auth();

    // Si querés que sólo usuarios logueados puedan crear posts:
    if (!session?.user?.id) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-sm text-slate-200 bg-slate-900/80 px-4 py-2 rounded-lg">
                    Debes iniciar sesión para crear una publicación.
                </p>
            </div>
        );
    }

    return (
        <div
            className="
                flex 
                flex-col 
                min-h-[calc(100vh-3.5rem)]  /* bajo la navbar aprox */
                md:min-h-[calc(100vh-4rem)]
                text-slate-100
            "
        >
            {/* Header de la página */}
            <header className="w-full py-3 md:py-4 border-b border-slate-800 mb-2">
                <h1 className="flex flex-col items-center text-lg md:text-2xl font-semibold w-full">
                    Nueva publicación
                </h1>
            </header>

            {/* Layout principal: aside izq + contenido central + aside der */}
            <div className="flex flex-1 w-full gap-4 px-2 md:px-4">
                {/* Aside izquierdo: sólo en pantallas grandes */}
                <aside className="hidden lg:block w-[220px] xl:w-[260px]">
                    <AsideLeft session={session}>
                        {/* Si en algún momento querés agregar algo específico para esta página, lo podés meter acá */}
                    </AsideLeft>
                </aside>

                {/* Columna central con el formulario */}
                <main className="w-full flex-1 flex justify-center">
                    <div className="w-full max-w-[720px] py-3">
                        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl px-4 py-4 md:px-6 md:py-6">
                            <div className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 px-4 py-4 md:px-5 md:py-5">
                                <CreatePostForm session={session} />
                            </div>
                        </div>
                    </div>
                </main>

                {/* Aside derecho: sólo en pantallas grandes */}
                <aside className="hidden xl:block w-[260px]">
                    <AsideRight session={session}>
                        {/* Lo mismo: espacio para widgets o info extra */}
                    </AsideRight>
                </aside>
            </div>
        </div>
    );
};

export default NewPostPage;


// reescrito
