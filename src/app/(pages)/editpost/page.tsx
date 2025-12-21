// src/app/(pages)/editpost/page.tsx

import { PostEdit } from "@/components/custom/postEdit";

interface EditPostPageProps {
    searchParams: Promise<{ post_id?: string }>;
}

const EditPostPage = async ({ searchParams }: EditPostPageProps) => {
    // 👈 AQUÍ es la diferencia clave
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

    return (
        <div className="min-h-screen w-full bg-slate-950 pt-16 px-2 md:px-4 flex justify-center">
            <main className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl px-4 py-4 md:px-6 md:py-6 text-slate-100">
                <h1 className="text-xl md:text-2xl font-semibold mb-4">
                    Editar post
                </h1>

                <PostEdit postId={numericId} />
            </main>
        </div>
    );
};

export default EditPostPage;


