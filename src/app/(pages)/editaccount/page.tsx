// src/app/(pages)/editaccount/page.tsx
import auth from "@/auth";
import EditAccount from "@/components/custom/editAccount";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";
import { getUserConfiguration } from "@/lib/configuration/getUserConfiguration";
import Link from "next/link";

export default async function EditAccountPage() {
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

    const configuration = await getUserConfiguration(userId);

    if (!configuration) {
        return (
            <div className="min-h-screen w-full bg-slate-950 pt-16 px-3 flex items-center justify-center">
                <div className="max-w-md w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-6 text-center text-slate-100 text-sm">
                    Configuración no encontrada.
                </div>
            </div>
        );
    }

    return (
        <div className="
        flex flex-col
                items-center
                min-h-[calc(100vh-3.5rem)]
                lg:min-h-[calc(100vh-4rem)]
                text-slate-100
                w-screen
                max-w-[600px]
                lg:w-[600px]
                bg-black">


            <AsideLeft session={session} />

            <EditAccount config={configuration} />

            <AsideRight session={session} />
        </div>
    );
}
