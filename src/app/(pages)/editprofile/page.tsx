// src/app/(pages)/editprofile/page.tsx
import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import EditProfile from "@/components/custom/editProfile";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";

export default async function EditProfilePage() {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId || !Number.isFinite(userId)) {
        return (
            <div className="min-h-screen w-full bg-slate-950 pt-16 px-3 flex items-center justify-center">
                <div className="max-w-md w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-6 text-center text-slate-100 text-sm">
                    No autenticado.
                </div>
            </div>
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,

            nick: true,
            bio: true,
            phoneNumber: true,
            movilNumber: true,
            birthday: true,

            countryId: true,
            provinceId: true,
            cityId: true,
            country: true,
            province: true,
            city: true,
            street: true,
            number: true,
            department: true,
            mail_code: true,

            website: true,
            language: true,
            occupation: true,
            company: true,

            twitterHandle: true,
            facebookHandle: true,
            instagramHandle: true,
            linkedinHandle: true,
            githubHandle: true,

            imageUrl: true,
            imagePublicId: true,
            imageWallUrl: true,
            imageWallPublicId: true,
            image: true,
            wallHeaderBackgroundColor: true,
            wallHeaderBackgroundType: true,

            visibility: true,
            darkModeEnabled: true,
            emailNotifications: true,
            pushNotifications: true,
        },
    });

    if (!user) {
        return (
            <div className="min-h-screen w-full bg-slate-950 pt-16 px-3 flex items-center justify-center">
                <div className="max-w-md w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-6 text-center text-slate-100 text-sm">
                    Usuario no encontrado.
                </div>
            </div>
        );
    }

    // ✅ Serializar birthday para pasarlo a client (Date -> string)
    const initialUser = {
        ...user,
        birthday: user.birthday ? user.birthday.toISOString() : null,
    };

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
        md:w-full">
            {/* Header */}
            <header className="w-full py-3 md:py-4 border-b border-slate-800 mb-2">
                <h1 className="flex flex-col items-center text-lg md:text-2xl font-semibold w-full">
                    Editar perfil
                </h1>
            </header>
            {/* Aside izquierdo */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={session}>
                    {/* Si en algún momento querés agregar algo específico para esta página, lo podés meter acá */}
                </AsideLeft>
            </aside>

            {/* Centro */}



            <EditProfile initialUser={initialUser} />



            {/* Aside derecho */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={session}>
                    {/* Lo mismo: espacio para widgets o info extra */}
                </AsideRight>
            </aside>

        </div>
    );
}


