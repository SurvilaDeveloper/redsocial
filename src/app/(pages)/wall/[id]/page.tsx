// src/app/(pages)/wall/[id]/page.tsx
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import { getSocialRelations } from "@/lib/social-relations";
import { getUserConfiguration } from "@/lib/configuration/getUserConfiguration";
import { areIEnableToView } from "@/lib/permissions";
import { myOwnPermissions } from "@/lib/permissions";

//import Navbar from "@/components/custom/navbar";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";
//import PostList from "@/components/custom/postList";
import WallHeader from "@/components/custom/wallHeader";
import WallPostList from "@/components/custom/WallPostList";

interface WallPageProps {
    params: Promise<{ id: string }>;
}

const WallPage = async ({ params }: WallPageProps) => {
    //const session = await auth();
    const wallUserId = Number((await params).id);
    const validated_session = await getValidatedSession()
    const userId = Number(validated_session.session?.user.id) || null
    const socialRelations = await getSocialRelations(userId, wallUserId)
    const configuration = await getUserConfiguration(wallUserId)
    let enableToViewObj: EnableToView;

    if (userId === wallUserId) {
        enableToViewObj = myOwnPermissions
    } else {
        enableToViewObj = areIEnableToView(configuration, validated_session.status === "ok", socialRelations.relState === 8, socialRelations.following)
    }
    // if (!Number.isFinite(wallUserId)) notFound();

    return (
        <div
            id="wall-page"
        >
            {/* Aside izquierdo */}
            <aside className="hidden lg:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={validated_session.session} />
            </aside>

            {/* Columna central */}
            <div className="w-full max-w-[720px] py-0 space-y-4 px-2 lg:px-0">
                {/* Header del muro */}
                {/*<WallHeader userId={wallUserId} enableToView={enableToViewObj} />*/}

                {/* Posts */}
                <WallPostList
                    session={validated_session.session}
                    wallUserId={wallUserId}
                    enableToView={enableToViewObj ?? null}
                />
            </div>

            {/* Aside derecho */}
            <aside className="hidden lg:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={validated_session.session} />
            </aside>
        </div>

    );
};

export default WallPage;
