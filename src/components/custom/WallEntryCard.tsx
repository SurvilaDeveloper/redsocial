// src/components/custom/WallEntryCard.tsx
"use client";

import { cfg } from "@/config";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
    Share2,
    Pin,
    Home,
    EyeOffIcon,
    EyeIcon,
    Earth,
    UserCheck,
    Footprints,
    Handshake,
} from "lucide-react";

import { PostCard } from "./postCard/PostCard";
import { ShareWithFriendModal } from "./share/ShareWithFriendModal";

const WALL_VISIBILITY_OPTIONS = [
    { value: 1, label: "Público" },
    { value: 2, label: "Solo logueados" },
    { value: 3, label: "Seguidores y amigos" },
    { value: 4, label: "Solo amigos" },
] as const;

function MiniUserLink({ user, href }: { user: any; href: string }) {
    if (!user) return null;

    return (
        <Link href={href} className="text-slate-100 flex flex-row gap-2 items-center">
            {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={user.imageUrl}
                    alt={`avatar de ${user.name ?? "usuario"}`}
                    className="w-6 h-6 rounded-full object-cover"
                />
            ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800" />
            )}
            <span className="hover:underline">{user.name ?? `Usuario ${user.id}`}</span>
        </Link>
    );
}

function isWallVisibility(v: any): v is 1 | 2 | 3 | 4 {
    return v === 1 || v === 2 || v === 3 || v === 4;
}

function formatIsoShort(iso: string | null | undefined) {
    if (!iso) return "-";
    return String(iso).slice(0, 19).replace("T", " ");
}

function VisibilityIcon({ visibility }: { visibility: 1 | 2 | 3 | 4 }) {
    if (visibility === 1) return <Earth size={16} />;
    if (visibility === 2) return <UserCheck size={16} />;
    if (visibility === 3)
        return (
            <div className="flex flex-row gap-0.5">
                <Footprints size={16} />
                <Handshake size={16} />
            </div>
        );
    return <Handshake size={16} />;
}

export function WallEntryCard({
    session,
    post,
    enableToView,
    showOwnerPanel,
    selectedViewMode,
    canToggleShowInFeed,
    onToggleShowInFeed,
    showInFeedLoading,
    onOpenDetail,

    // patch optimista del meta desde el feed
    onPatchWallEntryMeta,

    // ✅ NUEVO: en “ver como X”, forzamos que NO sea dueño
    simulateAsOwner,
}: any) {
    const meta = (post as any)?.wallEntryMeta;
    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;

    // ✅ shareCount global activo (si no viene, 0)
    const shareCount = typeof post?.shareCount === "number" ? post.shareCount : 0;

    const [shareOpen, setShareOpen] = useState(false);
    const [wallActionLoading, setWallActionLoading] = useState(false);

    const [pinLoading, setPinLoading] = useState(false);
    const [pinnedState, setPinnedState] = useState<null | { ok: boolean; eventAt?: string; entryId?: number }>(null);

    // si no hay meta, render normal
    if (!meta) {
        return (
            <PostCard
                session={session}
                post={post}
                variant="card"
                openCommentsInPage={false}
                enablePolling={false}
                enableOwnerControls={Boolean(showOwnerPanel)}
                onOpenDetail={onOpenDetail}
                enableToView={enableToView}
                showOwnerPanel={showOwnerPanel}
                selectedViewMode={selectedViewMode}
                wallContext={undefined}
            />
        );
    }

    const wallEntryId: number | null = typeof meta?.id === "number" ? meta.id : null;
    const showInFeed: boolean = Boolean(meta?.showInFeed);

    const wallUserId = meta?.wallUserId != null ? Number(meta.wallUserId) : null;
    const actorUserId = meta?.actorUserId != null ? Number(meta.actorUserId) : null;

    // ✅ clave para “Ver como”
    const isWallOwnerViewing =
        Boolean(simulateAsOwner) && sessionUserId != null && wallUserId != null ? sessionUserId === wallUserId : false;

    const isActorViewing = sessionUserId != null && actorUserId != null ? sessionUserId === actorUserId : false;

    // ⚠️ autor del post (real)
    const postAuthorId = post?.authorId != null ? Number(post.authorId) : null;
    const isPostAuthorViewing = sessionUserId != null && postAuthorId != null ? sessionUserId === postAuthorId : false;

    const isThirdParty =
        meta?.actorUserId != null && meta?.wallUserId != null ? Number(meta.actorUserId) !== Number(meta.wallUserId) : false;

    const showToggleShowInFeed =
        Boolean(canToggleShowInFeed) && isWallOwnerViewing && isThirdParty && wallEntryId != null;

    const wallContext = {
        showToggleShowInFeed,
        showInFeed,
        showInFeedLoading: Boolean(showInFeedLoading),
        onToggleShowInFeed: async () => {
            if (!showToggleShowInFeed) return;
            if (!onToggleShowInFeed) return;
            await onToggleShowInFeed(wallEntryId!);
        },
    };

    const wallUser = meta.wallUser;
    const actorUser = meta.actorUser;

    const isShared = meta.type === "SHARED";
    const isPinned = meta.type === "PINNED";
    const headerVerb = isShared ? "compartió" : isPinned ? "fijó" : "publicó";

    const showHeader = isThirdParty || isPinned;

    // estados locales
    const [entryActiveState, setEntryActiveState] = useState<number>(typeof meta?.active === "number" ? meta.active : 1);
    const [entryVisibilityState, setEntryVisibilityState] = useState<1 | 2 | 3 | 4>(
        isWallVisibility(meta?.visibility) ? meta.visibility : 1
    );

    // dropdown visibilidad (igual a OwnerToolbar)
    const [visibilityMenu, setVisibilityMenu] = useState(false);

    useEffect(() => {
        const next = typeof meta?.active === "number" ? meta.active : 1;
        setEntryActiveState(next);
    }, [meta?.active]);

    useEffect(() => {
        const next = isWallVisibility(meta?.visibility) ? meta.visibility : 1;
        setEntryVisibilityState(next);
    }, [meta?.visibility]);

    // debug info
    const eventAt: string | null = typeof meta?.eventAt === "string" ? meta.eventAt : null;
    //const showDebugBadge = useState(cfg.DEBUG)//useMemo(() => process.env.NODE_ENV !== "production", []);

    async function setEntryActive(nextActive: 0 | 1) {
        if (!isWallOwnerViewing || wallEntryId == null) return;

        const prev = entryActiveState;

        setEntryActiveState(nextActive);
        onPatchWallEntryMeta?.(wallEntryId, { active: nextActive });

        setWallActionLoading(true);
        try {
            const res = await fetch("/api/wall-entry/active", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallEntryId, active: nextActive }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.success) {
                setEntryActiveState(prev);
                onPatchWallEntryMeta?.(wallEntryId, { active: prev });
            } else {
                const confirmedActive = typeof data.wallEntry?.active === "number" ? (data.wallEntry.active as number) : nextActive;
                const confirmedVis = isWallVisibility(data.wallEntry?.visibility)
                    ? (data.wallEntry.visibility as 1 | 2 | 3 | 4)
                    : entryVisibilityState;

                setEntryActiveState(confirmedActive);
                setEntryVisibilityState(confirmedVis);

                onPatchWallEntryMeta?.(wallEntryId, { active: confirmedActive, visibility: confirmedVis });
            }
        } catch {
            setEntryActiveState(prev);
            onPatchWallEntryMeta?.(wallEntryId, { active: prev });
        } finally {
            setWallActionLoading(false);
        }
    }

    async function setEntryVisibility(nextVisibility: 1 | 2 | 3 | 4) {
        if (!isWallOwnerViewing || wallEntryId == null) return;

        const prev = entryVisibilityState;

        setEntryVisibilityState(nextVisibility);
        onPatchWallEntryMeta?.(wallEntryId, { visibility: nextVisibility });

        setWallActionLoading(true);
        try {
            const res = await fetch("/api/wall-entry/visibility", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallEntryId, visibility: nextVisibility }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.success) {
                setEntryVisibilityState(prev);
                onPatchWallEntryMeta?.(wallEntryId, { visibility: prev });
            } else {
                const confirmedActive =
                    typeof data.wallEntry?.active === "number" ? (data.wallEntry.active as number) : entryActiveState;
                const confirmedVis = isWallVisibility(data.wallEntry?.visibility)
                    ? (data.wallEntry.visibility as 1 | 2 | 3 | 4)
                    : nextVisibility;

                setEntryActiveState(confirmedActive);
                setEntryVisibilityState(confirmedVis);

                onPatchWallEntryMeta?.(wallEntryId, { active: confirmedActive, visibility: confirmedVis });
            }
        } catch {
            setEntryVisibilityState(prev);
            onPatchWallEntryMeta?.(wallEntryId, { visibility: prev });
        } finally {
            setWallActionLoading(false);
        }
    }

    async function pinInMyWall() {
        if (sessionUserId == null) return;

        const optimisticEventAt = new Date().toISOString();
        setPinnedState({ ok: true, eventAt: optimisticEventAt });
        setPinLoading(true);

        try {
            const res = await fetch("/api/wall/pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: post?.id }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.success) {
                setPinnedState({ ok: false });
                return;
            }

            const we = data.wallEntry;
            setPinnedState({
                ok: true,
                entryId: typeof we?.id === "number" ? we.id : undefined,
                eventAt: typeof we?.eventAt === "string" ? we.eventAt : optimisticEventAt,
            });
        } catch {
            setPinnedState({ ok: false });
        } finally {
            setPinLoading(false);
        }
    }

    // si el dueño del muro la ocultó y NO estás en modo owner => no renderiza
    if (!isWallOwnerViewing && entryActiveState !== 1) return null;

    // ✅ helpers UI “tipo OwnerToolbar”
    const btnBase =
        "flex flex-row items-center h-6 gap-1 text-[11px] px-2 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-50";

    const roundIconBtn =
        "h-8 w-8 flex items-center justify-center rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-50";

    return (
        <div className="w-full rounded-xl border border-slate-800 bg-black shadow-sm overflow-hidden">
            {/* Debug badge (solo dev) */}
            {cfg.DEBUG && (
                <div className="px-3 pt-2">
                    <div className="w-fit max-w-full rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-1 text-[10px] text-slate-300 flex flex-wrap gap-x-2 gap-y-1 items-center">
                        <span className="text-slate-500">debug:</span>
                        <span>type:{String(meta?.type ?? "")}</span>
                        <span>isPostAuthor:{isPostAuthorViewing ? "1" : "0"}</span>
                        <span>isWallOwner:{isWallOwnerViewing ? "1" : "0"}</span>
                        <span>isActor:{isActorViewing ? "1" : "0"}</span>
                        <span>vis:{entryVisibilityState}</span>
                        <span>active:{entryActiveState}</span>
                        <span>feed:{showInFeed ? "1" : "0"}</span>
                        <span>eventAt:{formatIsoShort(eventAt)}</span>
                        <span>pinned:{pinnedState == null ? "-" : pinnedState.ok ? "1" : "0"}</span>
                        <span>pinEventAt:{formatIsoShort(pinnedState?.eventAt)}</span>
                        <span>pinId:{pinnedState?.entryId ?? "-"}</span>
                    </div>
                </div>
            )}

            {showHeader && (
                <div className="px-3 py-2 border-b border-slate-800 bg-slate-950">
                    <div className="text-xs text-slate-400 flex flex-wrap gap-2 items-center justify-center">
                        <MiniUserLink user={actorUser} href={`/wall/${actorUser?.id ?? ""}`} />
                        <span className="opacity-80">{headerVerb}</span>

                        {wallUser && (
                            <>
                                <span className="opacity-80">en el muro de</span>
                                <MiniUserLink user={wallUser} href={`/wall/${wallUser.id}`} />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ✅ Barra estilo OwnerToolbar */}
            {(sessionUserId != null || showToggleShowInFeed || isWallOwnerViewing) && (
                <div className="mb-0 flex flex-row flex-wrap items-center gap-2 w-full min-h-8 text-white bg-black px-3 py-2 border-b border-slate-800">
                    {/* Compartir (logueado) */}
                    {sessionUserId != null && shareCount === 0 && (
                        <button
                            type="button"
                            onClick={() => setShareOpen(true)}
                            className={btnBase}
                            title="Compartir este post en el muro de un amigo"
                        >
                            <Share2 size={12} />
                        </button>
                    )}

                    {/* ✅ ShareCount global (activo) */}
                    {shareCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setShareOpen(true)}
                            className={btnBase}
                            title={`Compartir este post (ya fue compartido ${shareCount} ${shareCount === 1 ? "vez" : "veces"})`}
                        >
                            <Share2 size={12} className="opacity-80" />
                            <span className="tabular-nums">{shareCount}</span>
                        </button>
                    )}

                    {/* Fijar en mi muro (logueado) */}
                    {sessionUserId != null && (
                        <button
                            type="button"
                            onClick={pinInMyWall}
                            disabled={pinLoading}
                            className={btnBase}
                            title="Fijar este post en mi muro"
                        >
                            <Pin size={12} />
                        </button>
                    )}

                    {/* Toggle showInFeed (solo dueño del muro y third-party) */}
                    {showToggleShowInFeed && (
                        <button
                            type="button"
                            onClick={wallContext.onToggleShowInFeed}
                            disabled={Boolean(wallContext.showInFeedLoading)}
                            className={btnBase}
                            title={wallContext.showInFeed ? "Ocultar este post del inicio" : "Mostrar este post en el inicio"}
                        >
                            {wallContext.showInFeed ? (
                                <Home size={12} className="text-green-500" />
                            ) : (
                                <Home size={12} className="text-red-500" />
                            )}
                        </button>
                    )}

                    {/* Controles del dueño del muro */}
                    {isWallOwnerViewing && wallEntryId != null && (
                        <>
                            <button
                                type="button"
                                onClick={() => setEntryActive(entryActiveState === 1 ? 0 : 1)}
                                disabled={wallActionLoading}
                                title={entryActiveState === 1 ? "Ocultar en mi muro" : "Mostrar en mi muro"}
                                className={
                                    entryActiveState === 1 ? `${btnBase} hover:bg-red-800` : `${btnBase} hover:bg-green-800`
                                }
                            >
                                {entryActiveState === 1 ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
                            </button>

                            {/* Menú visibilidad (estilo OwnerToolbar) */}
                            <div className="relative ml-auto">
                                <button
                                    type="button"
                                    onClick={() => setVisibilityMenu((v) => !v)}
                                    disabled={wallActionLoading}
                                    title="Visibilidad de esta entrada en tu muro"
                                    className={roundIconBtn}
                                >
                                    <VisibilityIcon visibility={entryVisibilityState} />
                                </button>

                                {visibilityMenu && (
                                    <div className="absolute right-0 mt-2 w-72 bg-black text-slate-100 border border-slate-700 rounded-lg shadow-lg z-50 text-xs overflow-hidden">
                                        <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                            onClick={() => {
                                                setVisibilityMenu(false);
                                                setEntryVisibility(1);
                                            }}
                                        >
                                            <Earth size={16} />
                                            <span>Lo puede ver todo el mundo</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                            onClick={() => {
                                                setVisibilityMenu(false);
                                                setEntryVisibility(2);
                                            }}
                                        >
                                            <UserCheck size={16} />
                                            <span>Sólo usuarios logueados</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                            onClick={() => {
                                                setVisibilityMenu(false);
                                                setEntryVisibility(3);
                                            }}
                                        >
                                            <Footprints size={16} />
                                            <Handshake size={16} />
                                            <span>Seguidores y amigos</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                            onClick={() => {
                                                setVisibilityMenu(false);
                                                setEntryVisibility(4);
                                            }}
                                        >
                                            <Handshake size={16} />
                                            <span>Sólo amigos</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Inner: el post */}
            <div className="p-2">
                <PostCard
                    session={session}
                    post={post}
                    variant="card"
                    openCommentsInPage={false}
                    enablePolling={false}
                    enableOwnerControls={Boolean(showOwnerPanel)}
                    onOpenDetail={onOpenDetail}
                    enableToView={enableToView}
                    showOwnerPanel={showOwnerPanel}
                    selectedViewMode={selectedViewMode}
                    wallContext={wallContext}
                    embedded
                    hideFooterActions
                />
            </div>

            <ShareWithFriendModal open={shareOpen} onClose={() => setShareOpen(false)} postId={post.id} />
        </div>
    );
}

