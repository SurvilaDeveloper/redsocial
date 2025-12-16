import { pageContainer } from "@/app/classnames"
import PostList from "@/components/custom/postList"
import auth from "@/auth";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";


const WallPage = async ({ searchParams }: { searchParams: Promise<{ user?: string }> }) => {
    const user = (await searchParams).user || ""
    console.log("USER: ", user);
    const session = await auth(); // ⚡️ Ahora esperamos la sesión correctamente

    const userId = session ? session.user.id : ""; // Aquí obtendrás el ID real del usuario autenticado
    return (
        <div className={pageContainer}>
            <h1>Wall Page</h1>
            <div className="flex flex-row justify-between w-full m-0 p-0">
                <AsideLeft></AsideLeft>
                <PostList userId={parseInt(user)} />
                <AsideRight></AsideRight>
            </div>
        </div>
    )

}

export default WallPage