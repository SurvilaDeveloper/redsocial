// src/components/custom/loggedhome.tsx
"use client";

import { useSearchParams } from "next/navigation";
import AsideLeft from "./asideleft";
import AsideRight from "./asideright";
import ListSelect from "./listSelect";
import PostListLoggedHome from "./postListLoggedHome";
import PostFormWall from "./postFormWall";

const LoggedHome = ({ session }: { session: any }) => {
    const searchParams = useSearchParams();
    const friends = searchParams.get("friends"); // 👈 lo dejamos para usar más adelante

    return (
        <>
            {/* Aside izquierdo: sólo en pantallas grandes */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={session}>
                    {/* Más adelante, cuando ListSelect esté listo, lo descomentás */}
                    {/* <ListSelect /> */}
                    <></>
                </AsideLeft>
            </aside>

            {/* Columna central: formulario + feed */}
            <div className="w-full max-w-[720px] py-0 space-y-4 px-2 md:px-0">
                <PostFormWall />

                {/* Por ahora siempre usamos el mismo feed.
                       Más adelante, PostListLoggedHome podría aceptar un prop:
                       <PostListLoggedHome session={session} mode={friends ? "friends" : "all"} />
                    */}
                <PostListLoggedHome session={session} />
            </div>


            {/* Aside derecho: sólo en pantallas extra grandes */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={session}>
                    <></>
                </AsideRight>
            </aside>
        </>
    );
};

export default LoggedHome;

