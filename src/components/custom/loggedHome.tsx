"use client";

import { useSearchParams } from "next/navigation";
import AsideLeft from "./asideleft";
import AsideRight from "./asideright";
import ListSelect from "./listSelect";
import PostListLoggedHome from "./postListLoggedHome";
import PostListLoggedHomeFriends from "./postListLoggedHomeFriends";
import PostFormWall from "./postFormWall";

const LoggedHome = ({ session }: { session: any }) => {
    const searchParams = useSearchParams();
    const friends = searchParams.get("friends"); // Captura el parámetro "friends"

    return (
        <>
            {/*<h1>Home (logueado) {session.user.id}</h1>*/}
            {/*<p>Filtro de amigos: {friends ? friends : "Ninguno"}</p>*/}
            <div id="LoggedHome" className="loggedHome">
                <AsideLeft>
                    <ListSelect />
                </AsideLeft>
                <div className="flex flex-col items-center w-[34%] md:bg-transparent">
                    <PostFormWall />
                    {friends && <PostListLoggedHomeFriends session={session} />}
                    {!friends && <PostListLoggedHome session={session} />}

                </div>


                <AsideRight>
                    <></>
                </AsideRight>
            </div>
        </>
    );
};

export default LoggedHome;
