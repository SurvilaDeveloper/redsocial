import { ReactNode } from "react"

const AsideRight = ({ children }: { children: ReactNode }) => {

    return (
        <aside id="AsideRight" className="asideRight">
            aside right
            <div className="fixed">
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo at id ex enim tempore nesciunt corrupti vitae sapiente ab alias hic dolorum eaque praesentium, non quaerat exercitationem, quis libero optio?</p>
                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quia enim architecto officiis quaerat esse excepturi, dolores consectetur accusantium vel reiciendis eveniet voluptatem quisquam blanditiis soluta cupiditate, minus quis incidunt maxime.</p>
            </div>


        </aside>
    )
}

export default AsideRight