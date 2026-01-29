// src/components/custom/postList.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { PostCard } from "./postCard/PostCard";
import { WallEntryCard } from "./WallEntryCard";
import { FeedMessage } from "./feedMessage";
import Link from "next/link";

import { Configuration } from "@/types/configuration";
import { isHeEnableToView, myOwnPermissions } from "@/lib/permissions";
import WallHeader from "./wallHeader";
import PostFormWall from "./postFormWall";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const VIEW_MODES = [
    { value: "owner", label: "Dueño (full)" },
    { value: "public", label: "Público" },
    { value: "logged", label: "Logueado" },
    { value: "followers_friends", label: "Seguidores/Amigos" },
    { value: "friends", label: "Solo amigos" },
] as const;

// helper: id “estable” por item del feed (WallEntry primero, fallback a Post)
function getFeedItemKey(post: any): string {
    const wallEntryId = post?.wallEntryMeta?.id;
    if (wallEntryId != null) return `we_${wallEntryId}`;
    return `p_${post?.id}`;
}

export default function PostList({
    session,
    userId,
    viewerType,
    comingFrom,
    enableToView,
    myConfiguration,
}: {
    session: any;
    userId: number; // wallUserId
    viewerType: "owner" | "user";
    comingFrom?: "mywall" | "wall" | "home";
    enableToView?: EnableToView | null;
    myConfiguration?: Configuration | null;
}) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostRef = useRef<HTMLDivElement | null>(null);

    // overlay detalle
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailPost, setDetailPost] = useState<Post | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    // permisos “simulados” (owner) o reales (user)
    const [enableToViewState, setEnableToViewState] = useState<EnableToView | null>(
        viewerType === "owner" ? myOwnPermissions : enableToView ?? null
    );

    const [showOwnerPanel, setShowOwnerPanel] = useState(true);
    const [selectedViewModeState, setSelectedViewModeState] = useState<number>(0);

    const [canPublishOnWall, setCanPublishOnWall] = useState(false);

    // ✅ endpoint toggle showInFeed
    const TOGGLE_URL = "/api/wall-entry/toggle-feed";

    // ✅ evitar doble toggle concurrente del mismo entry
    const [pendingToggleIds, setPendingToggleIds] = useState<Set<number>>(new Set());

    // cuando cambie el muro o el tipo de viewer => reset feed
    useEffect(() => {
        setPosts([]);
        setPage(1);
        setHasMore(true);
    }, [userId, viewerType]);

    // para viewerType=user: enableToView viene de props
    useEffect(() => {
        if (viewerType === "owner") return;
        setEnableToViewState(enableToView ?? null);
    }, [viewerType, enableToView]);

    const canViewPosts = enableToViewState?.posts ?? false;

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

            default:
                break;
        }
    };

    // fetch wall feed
    const isFetchingRef = useRef(false);

    useEffect(() => {
        async function fetchPosts() {
            if (!hasMore) return;
            if (isFetchingRef.current) return; // ✅ evita requests repetidos en dev/strict
            isFetchingRef.current = true;

            setLoading(true);
            try {
                const url = `/api/wall-posts?wall_user_id=${userId}&page=${page}`;
                const res = await fetch(url, { cache: "no-store" });
                const data = await res.json();

                if (typeof data?.canPublishOnWall === "boolean") {
                    setCanPublishOnWall(data.canPublishOnWall);
                }


                const newPosts: Post[] = data?.allPosts ?? [];

                if (!newPosts.length) {
                    setHasMore(false);
                    return;
                }

                setPosts((prev) => {
                    const existingKeys = new Set(prev.map((p: any) => getFeedItemKey(p)));
                    const unique = newPosts.filter((p: any) => !existingKeys.has(getFeedItemKey(p)));
                    return [...prev, ...unique];
                });
            } catch (error) {
                console.error("Error cargando wall feed:", error);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        }

        fetchPosts();
    }, [page, userId, hasMore]); // ✅ NO incluir loading

    // ✅ toggle showInFeed optimista (solo para dueño del muro)
    const toggleShowInFeedOptimistic = async (wallEntryId: number) => {
        if (!Number.isFinite(wallEntryId)) return;
        if (pendingToggleIds.has(wallEntryId)) return;

        // guardo el valor previo SOLO para este entry (rollback fino)
        const prevValue =
            Boolean(
                (posts as any[]).find((p) => p?.wallEntryMeta?.id === wallEntryId)?.wallEntryMeta?.showInFeed
            );

        setPendingToggleIds((prev) => new Set(prev).add(wallEntryId));

        // optimistic flip
        setPosts((curr: any[]) =>
            curr.map((p) => {
                const meta = p?.wallEntryMeta;
                if (!meta || meta.id !== wallEntryId) return p;
                return {
                    ...p,
                    wallEntryMeta: {
                        ...meta,
                        showInFeed: !meta.showInFeed,
                    },
                };
            })
        );

        try {
            const res = await fetch(TOGGLE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallEntryId }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.success) {
                // rollback fino
                setPosts((curr: any[]) =>
                    curr.map((p) => {
                        const meta = p?.wallEntryMeta;
                        if (!meta || meta.id !== wallEntryId) return p;
                        return {
                            ...p,
                            wallEntryMeta: { ...meta, showInFeed: prevValue },
                        };
                    })
                );
                return;
            }

            // sync con valor real del server
            setPosts((curr: any[]) =>
                curr.map((p) => {
                    const meta = p?.wallEntryMeta;
                    if (!meta || meta.id !== wallEntryId) return p;
                    return {
                        ...p,
                        wallEntryMeta: {
                            ...meta,
                            showInFeed: Boolean(data.showInFeed),
                        },
                    };
                })
            );
        } catch {
            // rollback fino
            setPosts((curr: any[]) =>
                curr.map((p) => {
                    const meta = p?.wallEntryMeta;
                    if (!meta || meta.id !== wallEntryId) return p;
                    return {
                        ...p,
                        wallEntryMeta: { ...meta, showInFeed: prevValue },
                    };
                })
            );
        } finally {
            setPendingToggleIds((prev) => {
                const next = new Set(prev);
                next.delete(wallEntryId);
                return next;
            });
        }
    };

    // infinite scroll
    useEffect(() => {
        if (!hasMore || loading) return;

        observer.current?.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loading) {
                setPage((prev) => prev + 1);
            }
        });

        const el = lastPostRef.current;
        if (el) observer.current.observe(el);

        return () => observer.current?.disconnect();
    }, [posts, hasMore, loading]);

    // detalle
    const handleOpenDetail = async (postId: number) => {
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setDetailPost(null);

        try {
            const res = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const msg = data?.error
                    ? "Post no encontrado:"
                    : `No se pudo cargar el post (HTTP ${res.status})`;
                setDetailError(msg);
                return;
            }

            if (!data?.data) {
                setDetailError("Respuesta inválida del servidor.");
                return;
            }

            setDetailPost(data.data as Post);
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
    };

    return (
        <div id="PostListMyWall" className="relative flex flex-col w-full gap-10 lg:px-0">
            {comingFrom === "mywall" && viewerType === "owner" && myConfiguration && (
                <div className="flex flex-row px-2">
                    <span className="w-full">Ver como</span>

                    <Select
                        value={VIEW_MODES[selectedViewModeState]?.value ?? "owner"}
                        onValueChange={(v) => viewMode(v)}
                    >
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

            {(comingFrom === "mywall" || comingFrom === "wall") && (
                <>
                    <WallHeader userId={userId} enableToView={enableToViewState ?? null} />

                    {canPublishOnWall && (
                        <PostFormWall wallUserId={userId} canPublish={canPublishOnWall} />
                    )}
                </>
            )}


            {canViewPosts ? (
                <>
                    {/* Feed del muro (WallEntry feed) */}
                    {posts.map((post: any, index) => (
                        <div
                            key={getFeedItemKey(post)}
                            className="w-full"
                            ref={index === posts.length - 1 ? lastPostRef : null}
                        >
                            {/*
                              ✅ Condición de UI:
                              - Solo dueño del muro puede togglear
                              - Solo si entry fue creado por tercero (actor != wallUser)
                            */}
                            {(() => {
                                const meta = post?.wallEntryMeta;
                                const wallEntryId = meta?.id;
                                const sessionUserId = session?.user?.id != null ? Number(session.user.id) : null;
                                const isWallOwnerViewing =
                                    sessionUserId != null && meta?.wallUserId != null
                                        ? sessionUserId === Number(meta.wallUserId)
                                        : false;
                                const isThirdPartyEntry =
                                    meta?.actorUserId != null && meta?.wallUserId != null
                                        ? Number(meta.actorUserId) !== Number(meta.wallUserId)
                                        : false;

                                const canToggleShowInFeed = isWallOwnerViewing && isThirdPartyEntry;
                                const showInFeedLoading =
                                    typeof wallEntryId === "number" ? pendingToggleIds.has(wallEntryId) : false;

                                return (
                                    <WallEntryCard
                                        session={session}
                                        post={post}
                                        comingFrom={comingFrom}
                                        enableToView={enableToViewState}
                                        showOwnerPanel={showOwnerPanel}
                                        selectedViewMode={selectedViewModeState}
                                        canToggleShowInFeed={canToggleShowInFeed}
                                        onToggleShowInFeed={toggleShowInFeedOptimistic}
                                        showInFeedLoading={showInFeedLoading}
                                        onOpenDetail={handleOpenDetail}
                                    />

                                );
                            })()}
                        </div>
                    ))}

                    {loading && <p className="text-xs text-slate-200 mt-2">Cargando...</p>}

                    {!hasMore && (
                        <p className="text-center text-xs opacity-70 text-slate-300 mt-2">
                            No hay más posts
                        </p>
                    )}

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
                                            <div className="flex items-center justify-center h-full text-slate-200 text-sm">
                                                Cargando post...
                                            </div>
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
                                                    comingFrom={comingFrom}
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
                                Posiblemente este post haya sido eliminado y permanece en la
                                papelera de reciclaje.
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
            ) : (
                <FeedMessage>No tienes permiso para ver las publicaciones de este usuario/a</FeedMessage>
            )}
        </div>
    );
}


