// src/components/custom/asideright.tsx
import { ReactNode } from "react";

type AsideRightProps = {
    session: any | null;
    children?: ReactNode;
};

function AsideRight({ session, children }: AsideRightProps) {
    const hasSession = Boolean(session?.user?.id);

    return (
        <div className="hidden lg:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12 px-2 py-3 text-sm text-slate-100 bg-[rgb(1,3,12)]">
            {hasSession ? (
                <>
                    <p className="text-xs text-slate-300 mb-2">
                        AsideRight: usuario logueado. Por ahora muestra este párrafo. Luego irán otros componentes acá.
                    </p>
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

export default AsideRight;


