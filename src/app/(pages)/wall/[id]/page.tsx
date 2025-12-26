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
        <div className="flex flex-col min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] text-slate-100">
            <div className="flex flex-1 w-full gap-4">
                {/* Aside izquierdo */}
                <aside className="hidden lg:block w-[220px] xl:w-[260px]">
                    <AsideLeft session={session} />
                </aside>

                {/* Columna central */}
                <main className="w-full flex-1 flex justify-center">
                    <div className="w-full max-w-[720px] py-3">
                        {/* Header del muro */}
                        <WallHeader session={session} userId={wallUserId} />

                        {/* Posts */}
                        <PostList session={session} userId={wallUserId} viewerType="user" comingFrom="wall" />
                    </div>
                </main>

                {/* Aside derecho */}
                <aside className="hidden xl:block w-[260px]">
                    <AsideRight session={session} />
                </aside>
            </div>
        </div>
    );
};

export default WallPage;
