// src/app/components/feedMessage

import { ReactNode } from "react"

export const FeedMessage = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex flex-row items-center justify-center border border-slate-400 rounded-[4px] text-slate-400 w-full h-6 text-[12px]">
            {children}
        </div>
    )
}