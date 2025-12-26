// src/app/(pages)/editprofile/page.tsx
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
//import EditProfile from "@/components/custom/editProfile";
import EditAccount from "@/components/custom/editAccount";

export default async function EditAccountPage() {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId || !Number.isFinite(userId)) {
        return (
            <div className="min-h-screen w-full bg-slate-950 pt-16 px-3 flex items-center justify-center" >
                <div className="max-w-md w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-6 text-center text-slate-100 text-sm" >
                    No autenticado.
                </div>
            </div>
        );
    }

    const configuration = await prisma.configuration.findUnique({
        where: {
            userId: userId,
        },
        select: {
            id: true,
            userId: true,

            // ---- Perfil ----
            profileImageVisibility: true,
            coverImageVisibility: true,
            fullProfileVisibility: true,

            // ---- Muro y contenido ----
            wallVisibility: true,
            postsVisibility: true,
            postCommentsVisibility: true,
            postRepliesVisibility: true,

            mediaVisibility: true,
            mediaCommentsVisibility: true,
            mediaRepliesVisibility: true,

            // ---- Relaciones ----
            friendsListVisibility: true,
            followersListVisibility: true,
            followingListVisibility: true,

            // ---- Interacciones ----
            likesVisibility: true,
            privateMessagesVisibility: true,
        },
    });


    if (!configuration) {
        return (
            <div className="min-h-screen w-full bg-slate-950 pt-16 px-3 flex items-center justify-center" >
                <div className="max-w-md w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-6 text-center text-slate-100 text-sm" >
                    Configuración no encontrada.
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen w-full bg-slate-950 pt-16 px-2 md:px-4 flex justify-center" >
            <main className="w-full max-w-5xl flex gap-4" >
                {/* Aside izquierdo */}
                < aside className="hidden lg:block w-64 shrink-0" >
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-slate-200" >
                        <p className="text-sm font-semibold" > Menú </p>
                        < p className="text-xs text-slate-400 mt-1" >
                            (Sidebar izquierdo)
                        </p>
                    </div>
                </aside>

                {/* Centro */}
                <section className="flex-1" >
                    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl px-4 py-4 md:px-6 md:py-6 text-slate-100" >
                        <h1 className="text-xl md:text-2xl font-semibold mb-4" >
                            Editar Cuenta
                        </h1>

                        < div className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 px-4 py-4 md:px-5 md:py-5" >
                            {/* EditAccount */}
                            <EditAccount config={configuration} />
                        </div>
                    </div>
                </section>

                {/* Aside derecho */}
                <aside className="hidden xl:block w-72 shrink-0" >
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-slate-200" >
                        <p className="text-sm font-semibold" > Tips </p>
                        < p className="text-xs text-slate-400 mt-1" >
                            (Sidebar derecho)
                        </p>
                    </div>
                </aside>
            </main>
        </div>
    );
}