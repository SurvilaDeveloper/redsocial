import { pageContainer } from "@/app/classnames";
import PostList from "@/components/custom/postList";
import auth from "@/auth";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";

const MyWallPage = async () => {
    const session = await auth();

    if (!session?.user?.id) {
        return <div className={pageContainer}>Debes iniciar sesión</div>;
    }

    const userId = Number(session.user.id);

    return (
        <div className={pageContainer}>
            <h1>MyWallPage</h1>

            <div className="flex flex-row justify-between w-full m-0 p-0">
                <AsideLeft><></></AsideLeft>

                {/* ✅ pasar session */}
                <PostList session={session} userId={userId} />

                <AsideRight><></></AsideRight>
            </div>
        </div>
    );
};

export default MyWallPage;


