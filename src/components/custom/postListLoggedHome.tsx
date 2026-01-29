// src/components/custom/postListLoggedHome.tsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
//import { PostCard } from "./postCard";
import { PostCard } from "./postCard/PostCard";
import { FeedMessage } from "./feedMessage";
import Link from "next/link";
import { MyWallHeader } from "./MyWallHeader";
import { getUserConfiguration } from "@/lib/configuration/getUserConfiguration";
import { Configuration } from "@/types/configuration";
import { isHeEnableToView } from "@/lib/permissions";
import { myOwnPermissions } from "@/lib/permissions";

const SOCIAL_RELATIONS_ISFOLLOWER: SocialRelations = {
    relState: 0,
    following: false,
    isFollower: true
}

const SOCIAL_RELATIONS_ISFRIEND: SocialRelations = {
    relState: 8,
    following: false,
    isFollower: false
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
    userId: number;
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

    // 🔹 Overlay de detalle (estilo Instagram)
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailPost, setDetailPost] = useState<Post | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [enableToViewState, setEnableToViewState] = useState<EnableToView | null | undefined>(viewerType === "owner" ? myOwnPermissions : enableToView)
    const [enableToViewPostsState, setEnableToViewPostsState] = useState<boolean | undefined>(enableToViewState?.posts)
    const [showOwnerPanel, setShowOwnerPanel] = useState(true)
    const [selectedViewModeState, setSelectedViewModeState] = useState<number>(0);

    const viewMode = (m: string) => {
        console.log("m en viewMode:", m)
        if (myConfiguration) {
            let etv: EnableToView | null;
            console.log("myConfiguration: ", myConfiguration);
            switch (m) {
                case ("owner"):
                    console.log("0");
                    etv = myOwnPermissions
                    setEnableToViewState(etv)
                    setShowOwnerPanel(true)
                    setSelectedViewModeState(0)
                    console.log("etv: ", etv);
                    break;
                case ("public"):
                    console.log("1");
                    etv = isHeEnableToView(myConfiguration, false, false, false)
                    setEnableToViewState(etv)
                    setShowOwnerPanel(false)
                    setSelectedViewModeState(1)
                    if (posts)
                        console.log("etv: ", etv);
                    break;
                case ("logged"):
                    console.log("2");
                    etv = isHeEnableToView(myConfiguration, true, false, false)
                    setEnableToViewState(etv)
                    setShowOwnerPanel(false)
                    setSelectedViewModeState(2)
                    console.log("etv: ", etv);
                    break;
                case ("followers_friends"):
                    console.log("3");
                    etv = isHeEnableToView(myConfiguration, true, true, true)
                    setEnableToViewState(etv)
                    setShowOwnerPanel(false)
                    setSelectedViewModeState(3)
                    console.log("etv: ", etv);
                    break;
                case ("friends"):
                    console.log("4");
                    etv = isHeEnableToView(myConfiguration, true, true, false)
                    setEnableToViewState(etv)
                    setShowOwnerPanel(false)
                    setSelectedViewModeState(4)
                    console.log("etv: ", etv);
                    break;
                default:
                    console.log("default");
            }
        }
    }

    console.log("SESSION: ", session);
    // 🔹 Carga de posts del propio usuario
    useEffect(() => {
        setEnableToViewPostsState(enableToViewState?.posts)
    }, [enableToViewState])

    useEffect(() => {
        async function fetchPosts() {
            if (!hasMore) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/last-posts?page=${page}`, {
                    cache: "no-store",
                });
                const data = await res.json();

                const newPosts: Post[] = data?.allPosts ?? [];

                if (!newPosts.length) {
                    setHasMore(false);
                } else {
                    setPosts((prev) => {
                        const existingIds = new Set(prev.map((p) => p.id));
                        const unique = newPosts.filter(
                            (p) => !existingIds.has(p.id)
                        );
                        return [...prev, ...unique];
                    });
                }
            } catch (e) {
                console.error("Error cargando posts:", e);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, [page, hasMore]);

    // 🔹 Infinite scroll
    useEffect(() => {
        if (!hasMore) return;

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

    // 🔹 Como este es "Mi muro", el viewer siempre es el dueño
    const visiblePosts = useMemo(
        () =>
            posts.filter((p) => {
                if (p.user_id !== userId) return false;
                return true;
            }),
        [posts, userId]
    );

    // 🔹 Abrir detalle: traemos /api/posts/:id
    const handleOpenDetail = async (postId: number) => {
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setDetailPost(null);

        try {
            const res = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                // ✅ NO throw => no aparece “error del navegador”
                const msg = data?.error ? "Post no encontrado:" : `No se pudo cargar el post (HTTP ${res.status})`;
                setDetailError(msg);
                return;
            }

            if (!data?.data) {
                setDetailError("Respuesta inválida del servidor.");
                return;
            }

            setDetailPost(data.data as Post);
        } catch {
            // ✅ Error real de red / CORS / etc, también sin throw
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

            {comingFrom === "mywall" &&
                <>
                    <MyWallHeader onChange={viewMode} />
                </>
            }
            {enableToViewPostsState ? (
                <>
                    {/* Feed de tu muro */}
                    {visiblePosts.map((post, index) => (
                        <div
                            key={post.id}
                            className="w-full"
                            ref={index === visiblePosts.length - 1 ? lastPostRef : null}
                        >
                            <PostCard
                                session={session}
                                post={post}
                                variant="card"
                                openCommentsInPage={false}
                                enablePolling={false}
                                enableOwnerControls={true}
                                onOpenDetail={handleOpenDetail}
                                comingFrom={comingFrom}
                                enableToView={enableToViewState}
                                showOwnerPanel={showOwnerPanel}
                                selectedViewMode={selectedViewModeState}
                            />
                        </div>
                    ))}

                    {loading && <p className="text-xs text-slate-200 mt-2">Cargando...</p>}

                    {!hasMore && (
                        <p className="text-center text-xs opacity-70 text-slate-300 mt-2">
                            No hay más posts
                        </p>
                    )}

                    {/* Overlay tipo Instagram para ver el post completo con comentarios */}
                    {detailOpen && !detailError && (
                        <div className="fixed inset-0 z-50 bg-black/80">
                            {/* Mobile: scroll del overlay. Desktop: no, scroll interno */}
                            <div className="h-full w-full overflow-y-auto lg:overflow-hidden">
                                <div className="mx-auto w-full max-w-full lg:max-w-[92vw] lg:h-[100dvh] lg:py-4 px-0 lg:px-2 min-h-0">
                                    <div className="relative w-full bg-slate-950 shadow-2xl lg:h-[calc(100dvh-32px)] h-auto overflow-hidden min-h-0 flex flex-col">
                                        {/* Botón cerrar */}
                                        <button
                                            type="button"
                                            onClick={handleCloseDetail}
                                            className="fixed top-3 right-1 z-20 px-3 py-1 text-xs rounded-full bg-black/80 text-slate-100 hover:bg-black"
                                        >
                                            ✕ Cerrar
                                        </button>

                                        {/* Contenido del detalle */}
                                        {detailLoading && (
                                            <div className="flex items-center justify-center h-full text-slate-200 text-sm">
                                                Cargando post...
                                            </div>
                                        )}

                                        {detailPost && !detailLoading && !detailError && (
                                            // ✅ ESTE wrapper es clave: define el alto disponible para que adentro scrollee
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
                            {/* Botón cerrar */}
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
                                <Link href={"/trash"} className="flex flex-row text-white bg-green-900 rounded-[10px] hover:bg-green-800 justify-center items-center h-10">Papelera de reciclaje</Link>
                            </div>

                        </div>
                    )}

                </>
            ) : (
                <FeedMessage>
                    No tienes permiso para ver las publicaciones de este usuario/a
                </FeedMessage>
            )}
        </div>
    );
}


