import { pageContainer } from "@/app/classnames"
import PostList from "@/components/custom/postList"


const MyWallPage = () => {

    const userId = 57; // Aquí obtendrás el ID real del usuario autenticado
    return (
        <div className={pageContainer}>
            <h1>MyWallPage</h1>
            <PostList userId={userId} />
        </div>
    )

}

export default MyWallPage