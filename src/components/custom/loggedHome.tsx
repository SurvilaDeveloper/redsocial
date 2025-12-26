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
        <div
            id="LoggedHome"
            className="
                flex 
                flex-1 
                w-full 
                gap-4
            "
        >
            {/* Aside izquierdo: sólo en pantallas grandes */}
            <aside className="hidden lg:block w-[220px] xl:w-[260px]">
                <AsideLeft session={session}>
                    {/* Más adelante, cuando ListSelect esté listo, lo descomentás */}
                    {/* <ListSelect /> */}
                    <></>
                </AsideLeft>
            </aside>

            {/* Columna central: formulario + feed */}
            <main className=" w-full flex-1 flex justify-center">
                <div
                    className="
                        w-full 
                        max-w-[720px] 
                        py-3 
                        space-y-4
                    "
                >
                    <PostFormWall />

                    {/* Por ahora siempre usamos el mismo feed.
                       Más adelante, PostListLoggedHome podría aceptar un prop:
                       <PostListLoggedHome session={session} mode={friends ? "friends" : "all"} />
                    */}
                    <PostListLoggedHome session={session} />
                </div>
            </main>

            {/* Aside derecho: sólo en pantallas extra grandes */}
            <aside className="hidden xl:block w-[260px]">
                <AsideRight session={session}>
                    <></>
                </AsideRight>
            </aside>
        </div>
    );
};

export default LoggedHome;

