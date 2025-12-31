// src/app/(pages)/editpost/page.tsx
import auth from "@/auth";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";
import { PostEdit } from "@/components/custom/postEdit";

interface EditPostPageProps {
    searchParams: Promise<{ post_id?: string }>;
}

const EditPostPage = async ({ searchParams }: EditPostPageProps) => {
    // 👇 Igual que antes: resolvemos los searchParams
    const params = await searchParams;
    const post_id = params.post_id;

    if (!post_id) {
        return (
            <div className="min-h-screen w-full bg-slate-950 pt-16 px-3 flex items-center justify-center">
                <div className="max-w-md w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-6 text-center text-slate-100 text-sm">
                    Falta el parámetro <span className="font-mono">post_id</span> en la URL.
                </div>
            </div>
        );
    }

    const numericId = Number(post_id);
    if (!Number.isFinite(numericId)) {
        return (
            <div className="min-h-screen w-full bg-slate-950 pt-16 px-3 flex items-center justify-center">
                <div className="max-w-md w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-6 text-center text-slate-100 text-sm">
                    El <span className="font-mono">post_id</span> no es un número válido.
                </div>
            </div>
        );
    }

    // 🔹 Nueva parte: resolvemos la sesión acá
    const session = await auth();

    if (!session?.user?.id) {
        return (
            <div className="min-h-screen w-full bg-slate-950 pt-16 px-3 flex items-center justify-center">
                <div className="max-w-md w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-6 text-center text-slate-100 text-sm">
                    Debes iniciar sesión para editar un post.
                </div>
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
        md:min-w-[400px]
        md:w-full
            "
        >
            {/* Header */}
            <header className="w-full py-3 md:py-4 border-b border-slate-800 mb-2">
                <h1 className="flex flex-col items-center text-lg md:text-2xl font-semibold w-full">
                    Editar post
                </h1>
            </header>


            {/* Aside izquierdo: sólo en pantallas grandes */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={session} />
            </aside>

            {/* Columna central */}
            <div className="w-full max-w-[720px] py-0 space-y-4 px-2 md:px-0">
                {/* 🔹 Pasamos también session a PostEdit */}
                <PostEdit postId={numericId} session={session} />
            </div>

            {/* Aside derecho: sólo en pantallas grandes */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={session} />
            </aside>
        </div>

    );
};

export default EditPostPage;

// reescrito

