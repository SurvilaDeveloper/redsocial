import Link from "next/link"

const ListSelect = () => {

    return (
        <div>
            <div>
                <div>Buscar publicaciones de cualquier persona</div>
            </div>
            <div>
                <div>Buscar publicaciones de un amigo</div>
            </div>
            <div>
                <div>Buscar publicaciones de alguien a quien sigues</div>
            </div>
            <div>
                <Link href="/">Publicaciones en general</Link>
            </div>
            <div>
                <Link href="/?friends=true">Publicaciones de amigos</Link>
            </div>
            <div>
                <Link href="/">Publicaciones de quienes sigues</Link>
            </div>


        </div>
    )
}

export default ListSelect