// src/app/(pages)/editaccount/page.tsx
import auth from "@/auth";
import EditAccount from "@/components/custom/editAccount";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";
import { getUserConfiguration } from "@/lib/configuration/getUserConfiguration";

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
        <div
            className="
                flex flex-col
                min-h-[calc(100vh-3.5rem)]
                md:min-h-[calc(100vh-4rem)]
                text-slate-100
                w-full
                max-w-[400px]
                md:max-w-[33%]
                md:min-w-[400px]
                md:w-full
            "
        >
            <header className="w-full py-3 md:py-4 border-b border-slate-800 mb-2">
                <h1 className="flex flex-col items-center text-lg md:text-2xl font-semibold w-full">
                    Editar cuenta
                </h1>
            </header>

            <AsideLeft session={session} />

            <EditAccount config={configuration} />

            <AsideRight session={session} />
        </div>
    );
}
