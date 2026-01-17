// src/app/(pages)/wall/[id]/page.tsx
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import { getSocialRelations } from "@/lib/social-relations";
import { getUserConfiguration } from "@/lib/configuration/getUserConfiguration";
import { areIEnableToView } from "@/lib/permissions";

//import Navbar from "@/components/custom/navbar";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";
import PostList from "@/components/custom/postList";
import WallHeader from "@/components/custom/wallHeader";

interface WallPageProps {
    params: Promise<{ id: string }>;
}

const WallPage = async ({ params }: WallPageProps) => {
    //const session = await auth();
    const wallUserId = Number((await params).id);
    const vs = await getValidatedSession()
    const userId = Number(vs.session?.user.id) || null
    const socialRelations = await getSocialRelations(userId, wallUserId)
    const configuration = await getUserConfiguration(wallUserId)
    const enableToViewObj = areIEnableToView(configuration, vs.status === "ok", socialRelations.relState === 8, socialRelations.following)


    // if (!Number.isFinite(wallUserId)) notFound();

    return (
        <div
            id="wall-page"
            className="
        flex 
        flex-col 
        text-slate-100
        w-full
        md:max-w-[33%]
        md:min-w-[400px]
        md:w-full">
            {/* Aside izquierdo */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={vs.session} />
            </aside>

            {/* Columna central */}
            <div className="w-full max-w-[720px] py-0 space-y-4 px-2 md:px-0">
                {/* Header del muro */}
                <WallHeader session={vs.session} userId={wallUserId} enableToView={enableToViewObj} />

                {/* Posts */}
                <PostList session={vs.session} userId={wallUserId} viewerType="user" comingFrom="wall" enableToView={enableToViewObj} />
            </div>

            {/* Aside derecho */}
            <aside className="hidden md:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={vs.session} />
            </aside>
        </div>

    );
};

export default WallPage;
