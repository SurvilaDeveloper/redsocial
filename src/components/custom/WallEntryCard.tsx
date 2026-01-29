//src/components/custom/WallEntryCard.tsx
"use client";

import Link from "next/link";
import { PostCard } from "./postCard/PostCard";

export function WallEntryCard({
    session,
    post,
    comingFrom,
    enableToView,
    showOwnerPanel,
    selectedViewMode,
    canToggleShowInFeed,
    onToggleShowInFeed,
    showInFeedLoading,
    onOpenDetail,
}: any) {
    const meta = (post as any)?.wallEntryMeta;
    const isThirdParty = meta?.actorUserId != null && meta?.wallUserId != null
        ? Number(meta.actorUserId) !== Number(meta.wallUserId)
        : false;

    // si no es “post de tercero en muro ajeno”, render normal
    if (!isThirdParty || !meta?.wallUser) {
        return (
            <PostCard
                session={session}
                post={post}
                variant="card"
                openCommentsInPage={false}
                enablePolling={false}
                enableOwnerControls={true}
                onOpenDetail={onOpenDetail}
                comingFrom={comingFrom}
                enableToView={enableToView}
                showOwnerPanel={showOwnerPanel}
                selectedViewMode={selectedViewMode}
                canToggleShowInFeed={canToggleShowInFeed}
                onToggleShowInFeed={onToggleShowInFeed}
                showInFeedLoading={showInFeedLoading}
            />
        );
    }

    const wallUser = meta.wallUser;
    console.log('wallUser en WallEntryCard: ', wallUser);

    return (
        <div className="w-full rounded-xl border border-slate-800 bg-black shadow-sm overflow-hidden">
            {/* Header: dueño del muro */}
            <div className="px-3 py-2 border-b border-slate-800 bg-slate-950">
                <div className="text-xs text-slate-400 flex flex-row gap-2 items-center justify-center">
                    Publicado en el muro de{" "}
                    <Link
                        href={`/wall/${wallUser.id}`}
                        className="text-slate-100  flex flex-row gap-2 items-center justify-center"
                    >
                        <img src={wallUser.imageUrl} alt="imagen del dueño del muro" className="w-6 h-6 rounded-full" />
                        {wallUser.name ?? `Usuario ${wallUser.id}`}
                    </Link>
                </div>
            </div>

            {/* Inner: el post real (autor A) */}
            <div className="p-2">
                <PostCard
                    session={session}
                    post={post}
                    variant="card"
                    openCommentsInPage={false}
                    enablePolling={false}
                    enableOwnerControls={false}
                    onOpenDetail={onOpenDetail}
                    comingFrom={comingFrom}
                    enableToView={enableToView}
                    showOwnerPanel={showOwnerPanel}
                    selectedViewMode={selectedViewMode}
                    canToggleShowInFeed={canToggleShowInFeed}
                    onToggleShowInFeed={onToggleShowInFeed}
                    showInFeedLoading={showInFeedLoading}
                    embedded // ✅ nuevo flag (opcional)
                />
            </div>
        </div>
    );
}
