// src/app/(pages)/wall/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import auth from "@/auth";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";
import PostList from "@/components/custom/postList";
import WallHeader from "@/components/custom/wallHeader";
import { notFound } from "next/navigation";

interface WallPageProps {
    params: Promise<{ id: string }>;
}

const WallPage = async ({ params }: WallPageProps) => {
    const session = await auth();

    const wallUserId = Number((await params).id);
    // if (!Number.isFinite(wallUserId)) notFound();

    return (
        <div className="
        flex 
        flex-col 
        min-h-[calc(100vh-3.5rem)]  /* aprox alto disponible bajo la navbar en mobile */
        md:min-h-[calc(100vh-4rem)]
        text-slate-100
        w-full
        md:max-w-[33%]
        md:min-w-[400px]
        md:w-full">
            {/* Aside izquierdo */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={session} />
            </aside>

            {/* Columna central */}
            <div className="w-full max-w-[720px] py-0 space-y-4 px-2 md:px-0">
                {/* Header del muro */}
                <WallHeader session={session} userId={wallUserId} />

                {/* Posts */}
                <PostList session={session} userId={wallUserId} viewerType="user" comingFrom="wall" />
            </div>

            {/* Aside derecho */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={session} />
            </aside>
        </div>

    );
};

export default WallPage;
