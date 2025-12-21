// src/components/custom/asideleft.tsx
import { ReactNode } from "react";

const AsideLeft = ({ children }: { children: ReactNode }) => {
    return (
        <div
            id="AsideLeft"
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

export default AsideLeft;
