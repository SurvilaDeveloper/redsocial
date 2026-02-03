// src/components/custom/MyWallPostList.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Configuration } from "@/types/configuration";
import { isHeEnableToView, myOwnPermissions } from "@/lib/permissions";

import { WallEntryCard } from "./WallEntryCard";
import { FeedMessage } from "./feedMessage";
import { PostCard } from "./postCard/PostCard";
import WallHeader from "./wallHeader";
import PostFormWall from "./postFormWall";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInfiniteCursorFeed } from "@/hooks/useInfiniteCursorFeed";

const VIEW_MODES = [
    { value: "owner", label: "Dueño (full)" },
    { value: "public", label: "Público" },
    { value: "logged", label: "Logueado" },
    { value: "followers_friends", label: "Seguidores/Amigos" },
    { value: "friends", label: "Solo amigos" },
] as const;

function getFeedItemKey(post: any): string {
    const wallEntryId = post?.wallEntryMeta?.id;
    if (wallEntryId != null) return `we_${wallEntryId}`;
    return `p_${post?.id}`;
}

// ✅ regla única de visibilidad por "Ver como" para cualquier "visibility" (Post o WallEntry)
function canSeeByMode(selectedViewMode: number, visibility: number): boolean {
    // 0 = owner => siempre
    if (selectedViewMode === 0) return true;

    // 1 public:
    // 2 logged:
    // 3 followers/friends:
    // 4 friends:

    if (visibility === 1) return true; // público siempre
    if (selectedViewMode > 2 && visibility === 2) return true; // si soy follower/friend o friend, veo "solo logueados"
    if (selectedViewMode === visibility) return true; // match directo (2 con 2, 3 con 3, 4 con 4)
    if (selectedViewMode === 4 && visibility === 3) return true; // friend también puede ver follower/friends
    return false;
}

export default function MyWallPostList({
    session,
    userId,
    myConfiguration,
}: {
    session: any;
    userId: number;
    myConfiguration: Configuration | null;
}) {
    const [enableToViewState, setEnableToViewState] = useState<EnableToView | null>(myOwnPermissions);
    const [showOwnerPanel, setShowOwnerPanel] = useState(true);
    const [selectedViewModeState, setSelectedViewModeState] = useState<number>(0);
    const [canPublishOnWall, setCanPublishOnWall] = useState(false);

    // overlay detalle
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailPost, setDetailPost] = useState<Post | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const TOGGLE_URL = "/api/wall-entry/toggle-feed";
    const [pendingToggleIds, setPendingToggleIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        setEnableToViewState(myOwnPermissions);
    }, []);

    const viewMode = (m: string) => {
        if (!myConfiguration) return;

        let etv: EnableToView | null = null;

        switch (m) {
            case "owner":
                etv = myOwnPermissions;
                setEnableToViewState(etv);
                setShowOwnerPanel(true);
                setSelectedViewModeState(0);
                break;

            case "public":
                etv = isHeEnableToView(myConfiguration, false, false, false);
                setEnableToViewState(etv);
                setShowOwnerPanel(false);
                setSelectedViewModeState(1);
                break;

            case "logged":
                etv = isHeEnableToView(myConfiguration, true, false, false);
                setEnableToViewState(etv);
                setShowOwnerPanel(false);
                setSelectedViewModeState(2);
                break;

            case "followers_friends":
                etv = isHeEnableToView(myConfiguration, true, true, true);
                setEnableToViewState(etv);
                setShowOwnerPanel(false);
                setSelectedViewModeState(3);
                break;

            case "friends":
                etv = isHeEnableToView(myConfiguration, true, true, false);
                setEnableToViewState(etv);
                setShowOwnerPanel(false);
                setSelectedViewModeState(4);
                break;
        }
    };

    // ✅ feed SIEMPRE activo para poder simular (no lo apagamos por enableToViewState.posts)
    const feed = useInfiniteCursorFeed<Post>({
        enabled: true,
        getKey: (p: any) => getFeedItemKey(p),
        buildUrl: (cursor) =>
            cursor == null
                ? `/api/wall-posts?wall_user_id=${userId}`
                : `/api/wall-posts?wall_user_id=${userId}&cursor=${encodeURIComponent(cursor)}`,
        parse: (data) => {
            if (typeof data?.canPublishOnWall === "boolean") setCanPublishOnWall(data.canPublishOnWall);
            return {
                items: (data?.allPosts ?? []) as Post[],
                nextCursor: typeof data?.nextCursor === "string" ? data.nextCursor : null,
            };
        },
        autoStart: true,
    });

    const posts = feed.items;
    const setPosts = feed.setItems;

    const onPatchWallEntryMeta = (wallEntryId: number, patch: Record<string, any>) => {
        setPosts((curr: any[]) =>
            curr.map((p) => {
                const meta = p?.wallEntryMeta;
                if (!meta || meta.id !== wallEntryId) return p;
                return { ...p, wallEntryMeta: { ...meta, ...patch } };
            })
        );
    };

    const toggleShowInFeedOptimistic = async (wallEntryId: number) => {
        if (!Number.isFinite(wallEntryId)) return;
        if (pendingToggleIds.has(wallEntryId)) return;

        const meta = (posts as any[]).find((p) => p?.wallEntryMeta?.id === wallEntryId)?.wallEntryMeta;
        const prevValue = Boolean(meta?.showInFeed);

        setPendingToggleIds((prev) => new Set(prev).add(wallEntryId));
        onPatchWallEntryMeta(wallEntryId, { showInFeed: !prevValue });

        try {
            const res = await fetch(TOGGLE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallEntryId }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.success) {
                onPatchWallEntryMeta(wallEntryId, { showInFeed: prevValue });
                return;
            }

            onPatchWallEntryMeta(wallEntryId, { showInFeed: Boolean(data.showInFeed) });
        } catch {
            onPatchWallEntryMeta(wallEntryId, { showInFeed: prevValue });
        } finally {
            setPendingToggleIds((prev) => {
                const next = new Set(prev);
                next.delete(wallEntryId);
                return next;
            });
        }
    };

    const handleOpenDetail = async (postId: number) => {
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailError(null);

        const clicked = (posts as any[]).find((p) => Number(p?.id) === Number(postId)) ?? null;
        setDetailPost((clicked as any) ?? null);

        const originalMeta = (clicked as any)?.wallEntryMeta ?? null;

        try {
            const res = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setDetailError("Post no encontrado");
                return;
            }

            if (!data?.data) {
                setDetailError("Respuesta inválida del servidor.");
                return;
            }

            const shaped = data.data as Post;
            if (originalMeta) (shaped as any).wallEntryMeta = originalMeta;

            setDetailPost(shaped);
        } catch {
            setDetailError("Error de red cargando el post.");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setDetailPost(null);
        setDetailError(null);
        setDetailLoading(false);
    };

    // ✅ Regla final "mostrar o no" (WallEntry AND Post)
    const shouldRenderItem = (p: any) => {
        // Dueño: siempre muestra (para poder moderar/ver todo)
        if (selectedViewModeState === 0) return true;

        // Post-level
        if (p?.deletedAt) return false; // en modos no-dueño: no mostrar posts en papelera
        if ((p?.active ?? 1) !== 1) return false;
        const postVis = Number(p?.visibility ?? 1);
        if (!canSeeByMode(selectedViewModeState, postVis)) return false;

        // WallEntry-level (si existe)
        const meta = p?.wallEntryMeta;
        if (meta) {
            const entryActive = typeof meta.active === "number" ? meta.active : 1;
            if (entryActive !== 1) return false;

            const entryVis = Number(meta.visibility ?? 1);
            if (!canSeeByMode(selectedViewModeState, entryVis)) return false;
        }

        return true;
    };

    const visiblePosts = useMemo(() => posts.filter(shouldRenderItem), [posts, selectedViewModeState]);

    const canViewWallSection = selectedViewModeState === 0 ? true : Boolean(enableToViewState?.wall);
    const canViewPostsSection = selectedViewModeState === 0 ? true : Boolean(enableToViewState?.posts);

    // ✅ En simulación: si wall/posts no están permitidos por config, mostramos mensaje en vez de “nada”
    const allowRenderList = selectedViewModeState === 0 ? true : (canViewWallSection && canViewPostsSection);

    return (
        <div id="MyWallPostList" className="relative flex flex-col w-full gap-10 lg:px-0">
            {myConfiguration && (
                <div className="flex flex-row px-2">
                    <span className="w-full">Ver como</span>

                    <Select value={VIEW_MODES[selectedViewModeState]?.value ?? "owner"} onValueChange={(v) => viewMode(v)}>
                        <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-100">
                            <SelectValue placeholder="Modo de visualización" />
                        </SelectTrigger>

                        <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                            {VIEW_MODES.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <WallHeader userId={userId} enableToView={enableToViewState ?? null} />
            {canPublishOnWall && <PostFormWall wallUserId={userId} canPublish={canPublishOnWall} />}

            {!allowRenderList ? (
                <FeedMessage>En este modo, tu configuración no permite ver el muro o las publicaciones.</FeedMessage>
            ) : (
                <>
                    {visiblePosts.length === 0 && !feed.loading && (
                        <div className="px-2">
                            <div className="w-full rounded-lg border border-slate-800 bg-black px-3 py-2 text-xs text-slate-300">
                                No hay publicaciones visibles en este modo.
                            </div>
                        </div>
                    )}

                    {visiblePosts.map((post: any, index) => {
                        const meta = post?.wallEntryMeta;
                        const wallEntryId = meta?.id;

                        const sessionUserId = session?.user?.id != null ? Number(session.user.id) : null;

                        // ✅ En simulación NO sos dueño, aunque lo seas realmente (salvo modo owner)
                        const simulateAsOwner = selectedViewModeState === 0;

                        // ✅ Solo el dueño real (modo owner) puede togglear feed, y además solo third-party entry.
                        const isWallOwnerReal =
                            sessionUserId != null && meta?.wallUserId != null ? sessionUserId === Number(meta.wallUserId) : false;

                        const isThirdPartyEntry =
                            meta?.actorUserId != null && meta?.wallUserId != null
                                ? Number(meta.actorUserId) !== Number(meta.wallUserId)
                                : false;

                        const canToggleShowInFeed = simulateAsOwner && isWallOwnerReal && isThirdPartyEntry;

                        const showInFeedLoading = typeof wallEntryId === "number" ? pendingToggleIds.has(wallEntryId) : false;

                        return (
                            <div
                                key={getFeedItemKey(post)}
                                className="w-full"
                                ref={index === visiblePosts.length - 1 ? feed.sentinelRef : null}
                            >
                                <WallEntryCard
                                    session={session}
                                    post={post}
                                    enableToView={enableToViewState}
                                    showOwnerPanel={showOwnerPanel}
                                    selectedViewMode={selectedViewModeState}
                                    canToggleShowInFeed={canToggleShowInFeed}
                                    onToggleShowInFeed={toggleShowInFeedOptimistic}
                                    showInFeedLoading={showInFeedLoading}
                                    onOpenDetail={handleOpenDetail}
                                    onPatchWallEntryMeta={onPatchWallEntryMeta}
                                    simulateAsOwner={simulateAsOwner} // ✅ NUEVO
                                />
                            </div>
                        );
                    })}

                    {/* ✅ Si no hay visibles pero sí hay más, dejamos un sentinel “suelto” */}
                    {visiblePosts.length === 0 && feed.hasMore && <div ref={feed.sentinelRef} />}

                    {feed.loading && <p className="text-xs text-slate-200 mt-2">Cargando...</p>}
                    {!feed.hasMore && <p className="text-center text-xs opacity-70 text-slate-300 mt-2">No hay más posts</p>}

                    {/* Overlay detalle */}
                    {detailOpen && !detailError && (
                        <div className="fixed inset-0 z-50 bg-black/80">
                            <div className="h-full w-full overflow-y-auto lg:overflow-hidden">
                                <div className="mx-auto w-full max-w-full lg:max-w-[92vw] lg:h-[100dvh] lg:py-4 px-0 lg:px-2 min-h-0">
                                    <div className="relative w-full bg-slate-950 shadow-2xl lg:h-[calc(100dvh-32px)] h-auto overflow-hidden min-h-0 flex flex-col">
                                        <button
                                            type="button"
                                            onClick={handleCloseDetail}
                                            className="fixed top-3 right-1 z-20 px-3 py-1 text-xs rounded-full bg-black/80 text-slate-100 hover:bg-black"
                                        >
                                            ✕ Cerrar
                                        </button>

                                        {detailLoading && (
                                            <div className="flex items-center justify-center h-full text-slate-200 text-sm">Cargando post...</div>
                                        )}

                                        {detailPost && !detailLoading && !detailError && (
                                            <div className="flex-1 min-h-0">
                                                <PostCard
                                                    session={session}
                                                    post={detailPost}
                                                    variant="detail"
                                                    openCommentsInPage={false}
                                                    enablePolling={false}
                                                    enableOwnerControls={true}
                                                    enableToView={enableToViewState}
                                                    showOwnerPanel={showOwnerPanel}
                                                    selectedViewMode={selectedViewModeState}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {detailError && !detailLoading && (
                        <div className="fixed inset-0 flex z-50 bg-black/80 items-center justify-center">
                            <button
                                type="button"
                                onClick={handleCloseDetail}
                                className="fixed top-3 right-1 z-20 px-3 py-1 text-xs rounded-full bg-black/80 text-slate-100 hover:bg-black"
                            >
                                ✕ Cerrar
                            </button>

                            <div className="flex flex-col gap-3 p-4 text-red-400 text-sm lg:w-96 w-[90dvw] border border-red-400 rounded-xl bg-black">
                                {detailError}: <br />
                                Posiblemente este post haya sido eliminado y permanece en la papelera de reciclaje.
                                <Link
                                    href={"/trash"}
                                    className="flex flex-row text-white bg-green-900 rounded-[10px] hover:bg-green-800 justify-center items-center h-10"
                                >
                                    Papelera de reciclaje
                                </Link>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}




