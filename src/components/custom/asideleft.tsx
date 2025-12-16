import { ReactNode } from "react"

const AsideLeft = ({ children }: { children: ReactNode }) => {

    return (
        <aside id="AsideLeft" className="asideLeft">
            {children}
        </aside>
    )
}

export default AsideLeft