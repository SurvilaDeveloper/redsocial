// src/app/(pages)/mywall/page.tsx

import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";
import PostList from "@/components/custom/postList";
//import { getActiveSession } from "@/lib/auth/getActiveSession";
import { getValidatedSession } from "@/lib/auth/getValidatedSession";
import { getUserConfiguration } from "@/lib/configuration/getUserConfiguration";

const MyWallPage = async () => {
    //const session = await auth();
    const validated_session = await getValidatedSession();

    if (!validated_session.session?.user?.id) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-sm text-slate-200 bg-slate-900/80 px-4 py-2 rounded-lg">
                    Debes iniciar sesión
                </p>
            </div>
        );
    }

    const userId = Number(validated_session.session.user.id);

    const configuration = await getUserConfiguration(userId)

    console.log("configuration en MyWallPage:", configuration);

    return (
        <div id="my-wall-page">

            {/* Aside izquierdo */}
            <aside className="hidden lg:block w-[220px] xl:w-[260px] fixed left-0 top-0 h-full pt-12">
                <AsideLeft session={validated_session.session} />
            </aside>

            {/* Columna central */}
            <div className="w-full max-w-[720px] py-0 space-y-4 px-2 lg:px-0">
                <PostList
                    session={validated_session.session}
                    userId={userId}
                    viewerType="owner"
                    comingFrom="mywall"
                    myConfiguration={configuration}
                />
            </div>

            {/* Aside derecho */}
            <aside className="hidden lg:block w-[220px] xl:w-[260px] fixed right-4 top-0 h-full pt-12">
                <AsideRight session={validated_session.session} />
            </aside>
        </div>
    );
};

export default MyWallPage;





