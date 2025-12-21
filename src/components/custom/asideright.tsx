// src/components/custom/asideright.tsx
import { ReactNode } from "react";

const AsideRight = ({ children }: { children: ReactNode }) => {
    return (
        <div
            id="AsideRight"
            className="
                h-full
                w-full
                flex
                flex-col
                gap-4
                text-sm
                text-slate-200
            "
        >
            {children}
        </div>
    );
};

export default AsideRight;
