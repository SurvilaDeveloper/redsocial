// src/app/(pages)/search/page.tsx
import { pageContainer } from "@/app/classnames";
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import SearchUsersClient from "@/components/search/SearchUsersClient";

export default async function SearchPage() {
    const validated = await getValidatedSession();

    // Tu layout ya redirige si no está ok,
    // pero igual dejo el guard por si reutilizás el componente
    if (validated.status !== "ok") {
        return null;
    }

    const viewerId = Number(validated.session.user.id);

    return (
        <div className="        flex flex-col
                items-center
                min-h-[calc(100vh-3.5rem)]
                lg:min-h-[calc(100vh-4rem)]
                text-slate-100
                w-screen
                max-w-[600px]
                lg:w-[600px]
                bg-black">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-xl font-semibold text-slate-100">Buscar personas</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Buscá por nick, nombre, ubicación, ocupación, empresa, redes y (parcial) CV.
                </p>

                <div className="mt-4">
                    <SearchUsersClient viewerId={viewerId} />
                </div>
            </div>
        </div>
    );
}
