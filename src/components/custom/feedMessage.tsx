// src/app/components/feedMessage

import { ReactNode } from "react"

export const FeedMessage = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex flex-row items-center justify-center border border-slate-500 w-full text-[12px]">
            {children}
        </div>
    )
}