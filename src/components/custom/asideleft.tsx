// src/components/custom/asideleft.tsx
import { ReactNode } from "react";
import MainMenuDesktop from "./MainMenuDesktop";

type AsideLeftProps = {
    session: any | null;
    children?: ReactNode;
};

function AsideLeft({ session, children }: AsideLeftProps) {
    const hasSession = Boolean(session?.user?.id);

    return (
        <div className="hidden lg:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12 px-2 py-3 text-sm text-slate-100 bg-[rgb(1,3,12)]">
            {hasSession ? (
                <>
                    <MainMenuDesktop />
                    {children}
                </>
            ) : (
                <>
                    <p className="text-xs text-slate-400">
                        No hay sesión. Luego irán componentes para usuarios no logueados en este lugar.
                    </p>
                    {children}
                </>
            )}
        </div>
    );
}

export default AsideLeft;


