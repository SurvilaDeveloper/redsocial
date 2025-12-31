// src/app/(pages)/editprofile/page.tsx
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
//import EditProfile from "@/components/custom/editProfile";
import EditAccount from "@/components/custom/editAccount";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";

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
        <div className="flex 
        flex-col 
        min-h-[calc(100vh-3.5rem)]  /* aprox alto disponible bajo la navbar en mobile */
        md:min-h-[calc(100vh-4rem)]
        text-slate-100
        w-full
        max-w-[400px]
        md:max-w-[33%]
        md:min-w-[400px]
        md:w-full" >
            {/* Header */}
            <header className="w-full py-3 md:py-4 border-b border-slate-800 mb-2">
                <h1 className="flex flex-col items-center text-lg md:text-2xl font-semibold w-full">
                    Editar cuenta
                </h1>
            </header>

            {/* Aside izquierdo */}
            <AsideLeft session={session}>
                {/* Si en algún momento querés agregar algo específico para esta página, lo podés meter acá */}
            </AsideLeft>


            {/* Centro */}



            {/* EditAccount */}
            <EditAccount config={configuration} />



            {/* Aside derecho */}

            <AsideRight session={session}>
                {/* Lo mismo: espacio para widgets o info extra */}
            </AsideRight>


        </div>
    );
}