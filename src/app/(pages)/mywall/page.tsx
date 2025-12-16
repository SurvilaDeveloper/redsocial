import { pageContainer } from "@/app/classnames"
import PostList from "@/components/custom/postList"
import auth from "@/auth";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";


const MyWallPage = async () => {
    const session = await auth(); // ⚡️ Ahora esperamos la sesión correctamente

    const userId = session ? session.user.id : ""; // Aquí obtendrás el ID real del usuario autenticado
    return (
        <div className={pageContainer}>
            <h1>MyWallPage</h1>
            <div className="flex flex-row justify-between w-full m-0 p-0">
                <AsideLeft></AsideLeft>
                <PostList userId={parseInt(userId)} />
                <AsideRight></AsideRight>
            </div>
        </div>
    )

}

export default MyWallPage

