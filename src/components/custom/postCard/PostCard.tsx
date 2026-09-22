// src/components/custom/postCard/PostCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, MessageCircleOff } from "lucide-react";

import { updatePostActive, updatePostVisibility, softDeletePost } from "@/actions/post-action";
import { restorePost, hardDeletePost } from "@/actions/post-action";

import PostCardCommentsContainer from "../postCardCommentsContainer";
import PostCardCommentsResponsesContainer from "../postCardCommentsResponsesContainer";

import { OwnerToolbar } from "./OwnerToolbar";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { PostHeader } from "./PostHeader";
import { PostMedia } from "./PostMedia";
import { PostReactions } from "./PostReactions";
import { PostDetailLayout } from "./PostDetailLayout";
import { ShareWithFriendModal } from "../share/ShareWithFriendModal";

type WallContext = {
    showToggleShowInFeed?: boolean;
    showInFeed?: boolean;
    onToggleShowInFeed?: () => void | Promise<void>;
    showInFeedLoading?: boolean;
};

/* ===========================
 *  Link embeds helpers
 * =========================== */

type EmbedInfo = {
    url: string; // url original encontrada
    embedUrl: string; // url lista para iframe
    provider: "youtube" | "vimeo" | "twitch" | "spotify" | "tiktok" | "instagram";
};

function extractUrls(text: string): string[] {
    if (!text) return [];
    const re = /(?:https?:\/\/|www\.)[^\s<>()]+/gi;
    const matches = text.match(re) ?? [];
    const normalized = matches.map((u) => (u.startsWith("www.") ? `https://${u}` : u));
    return Array.from(new Set(normalized));
}

function safeUrl(u: string): URL | null {
    try {
        return new URL(u);
    } catch {
        return null;
    }
}

function youtubeIdFrom(url: URL): string | null {
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
        const id = url.pathname.split("/").filter(Boolean)[0];
        return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
        const v = url.searchParams.get("v");
        if (v) return v;

        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "shorts" && parts[1]) return parts[1];
        if (parts[0] === "embed" && parts[1]) return parts[1];
    }

    if (host === "youtube-nocookie.com") {
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "embed" && parts[1]) return parts[1];
    }

    return null;
}

function vimeoIdFrom(url: URL): string | null {
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;

    const parts = url.pathname.split("/").filter(Boolean);

    if (host === "player.vimeo.com") {
        const idx = parts.indexOf("video");
        const id = idx >= 0 ? parts[idx + 1] : null;
        return id && /^\d+$/.test(id) ? id : null;
    }

    const id = parts[0];
    return id && /^\d+$/.test(id) ? id : null;
}

function getTwitchParent(): string {
    // Twitch exige parent=tu-dominio. Como esto es "use client", window existe.
    try {
        const h = window.location.hostname;
        return h || "localhost";
    } catch {
        return "localhost";
    }
}

function toEmbed(rawUrl: string): EmbedInfo | null {
    const url = safeUrl(rawUrl);
    if (!url) return null;

    const host = url.hostname.replace(/^www\./, "");

    /* ---------------- YouTube ---------------- */
    const yid = youtubeIdFrom(url);
    if (yid) {
        return {
            url: rawUrl,
            embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yid)}?rel=0&modestbranding=1`,
            provider: "youtube",
        };
    }

    /* ---------------- Vimeo ---------------- */
    const vid = vimeoIdFrom(url);
    if (vid) {
        return {
            url: rawUrl,
            embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(vid)}`,
            provider: "vimeo",
        };
    }

    /* ---------------- Twitch ---------------- */
    // - Canal: https://www.twitch.tv/<channel>
    // - Video: https://www.twitch.tv/videos/<id>
    if (host === "twitch.tv") {
        const parts = url.pathname.split("/").filter(Boolean);

        if (parts.length === 1) {
            const channel = parts[0];
            return {
                url: rawUrl,
                embedUrl: `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(
                    getTwitchParent()
                )}`,
                provider: "twitch",
            };
        }

        if (parts[0] === "videos" && parts[1]) {
            return {
                url: rawUrl,
                embedUrl: `https://player.twitch.tv/?video=v${encodeURIComponent(parts[1])}&parent=${encodeURIComponent(
                    getTwitchParent()
                )}`,
                provider: "twitch",
            };
        }
    }

    /* ---------------- Spotify ---------------- */
    // https://open.spotify.com/track/...
    // https://open.spotify.com/playlist/...
    // => https://open.spotify.com/embed/track/...
    if (host === "open.spotify.com") {
        const path = url.pathname; // /track/... /playlist/... /album/... /episode/... /show/...
        return {
            url: rawUrl,
            embedUrl: `https://open.spotify.com/embed${path}`,
            provider: "spotify",
        };
    }

    /* ---------------- TikTok ---------------- */
    // https://www.tiktok.com/@user/video/<id>
    // => https://www.tiktok.com/embed/v2/<id>
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
        const parts = url.pathname.split("/").filter(Boolean);
        const idx = parts.indexOf("video");
        if (idx !== -1 && parts[idx + 1]) {
            const id = parts[idx + 1];
            return {
                url: rawUrl,
                embedUrl: `https://www.tiktok.com/embed/v2/${encodeURIComponent(id)}`,
                provider: "tiktok",
            };
        }
    }

    /* ---------------- Instagram ---------------- */
    // https://www.instagram.com/p/<code>/
    // https://www.instagram.com/reel/<code>/
    // https://www.instagram.com/tv/<code>/
    // => .../<type>/<code>/embed
    if (host === "instagram.com") {
        const parts = url.pathname.split("/").filter(Boolean);
        const type = parts[0];
        const code = parts[1];

        if ((type === "p" || type === "reel" || type === "tv") && code) {
            return {
                url: rawUrl,
                embedUrl: `https://www.instagram.com/${type}/${encodeURIComponent(code)}/embed`,
                provider: "instagram",
            };
        }
    }

    return null;
}

function linkifyText(
    text: string
): Array<{ type: "text"; value: string } | { type: "link"; value: string }> {
    if (!text) return [{ type: "text", value: "" }];

    const re = /((?:https?:\/\/|www\.)[^\s<>()]+)/gi;
    const parts: Array<{ type: "text" | "link"; value: string }> = [];

    let lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
        const start = m.index;
        const end = start + m[0].length;

        if (start > lastIndex) {
            parts.push({ type: "text", value: text.slice(lastIndex, start) });
        }
        parts.push({ type: "link", value: m[0] });
        lastIndex = end;
    }

    if (lastIndex < text.length) {
        parts.push({ type: "text", value: text.slice(lastIndex) });
    }

    return parts;
}

function LinkifiedDescription({
    text,
    onToggleExpand,
    className,
    maxEmbeds = 2,
}: {
    text: string;
    onToggleExpand: () => void;
    className?: string;
    maxEmbeds?: number;
}) {
    const urls = useMemo(() => extractUrls(text), [text]);

    const embeds = useMemo(() => {
        if (!urls.length) return [];

        const e = toEmbed(urls[0]); // ✅ solo el primer link
        return e ? [e] : [];
    }, [urls]);

    const tokens = useMemo(() => linkifyText(text), [text]);

    // --- viewport pause: remount iframe cuando sale del viewport ---
    const hostRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [reloadNonce, setReloadNonce] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!embeds.length) return;

        const obs = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const el = entry.target as HTMLDivElement;
                    const id = el.dataset.embedId;
                    if (!id) continue;

                    // Si sale del viewport -> force remount (corta reproducción)
                    if (!entry.isIntersecting) {
                        setReloadNonce((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
                    }
                }
            },
            {
                root: null,
                // “sale del viewport” cuando no hay nada visible.
                threshold: 0,
                // un pequeño margen para cortar un poquito antes
                rootMargin: "0px 0px -15% 0px",
            }
        );

        // observar todos los contenedores actuales
        for (const e of embeds) {
            const id = e.embedUrl; // id estable por embed
            const node = hostRefs.current[id];
            if (node) obs.observe(node);
        }

        return () => obs.disconnect();
    }, [embeds]);

    const ratioPaddingTop = (provider: EmbedInfo["provider"]) => {
        if (provider === "spotify") return "0";
        return "56.25%"; // 16:9
    };

    const fixedHeight = (provider: EmbedInfo["provider"]) => {
        if (provider === "spotify") return 152;
        if (provider === "instagram") return 480;
        if (provider === "tiktok") return 560;
        return null;
    };

    return (
        <div className="mt-2">
            <pre
                onClick={onToggleExpand}
                title="Click para ver completo / contraer"
                className={
                    className ??
                    "text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
                }
            >
                {tokens.map((t, idx) => {
                    if (t.type === "text") return <React.Fragment key={idx}>{t.value}</React.Fragment>;

                    const href = t.value.startsWith("www.") ? `https://${t.value}` : t.value;

                    return (
                        <a
                            key={idx}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // no expand/collapse al clickear link
                            className="underline text-sky-300 hover:text-sky-200"
                        >
                            {t.value}
                        </a>
                    );
                })}
            </pre>

            {embeds.length > 0 && (
                <div className="mt-3 flex flex-col gap-3">
                    {embeds.map((e) => {
                        const id = e.embedUrl; // id estable por embed detectado
                        const nonce = reloadNonce[id] ?? 0;
                        const h = fixedHeight(e.provider);
                        const pad = ratioPaddingTop(e.provider);

                        // clave que cambia cuando el embed sale del viewport
                        const iframeKey = `${id}::${nonce}`;

                        return (
                            <div
                                key={id}
                                ref={(node) => {
                                    hostRefs.current[id] = node;
                                }}
                                data-embed-id={id}
                                className="w-full overflow-hidden rounded-xl border border-slate-800 bg-black"
                            >
                                {h ? (
                                    <div className="w-full">
                                        <iframe
                                            key={iframeKey}
                                            className="h-full w-full"
                                            style={{ height: h }}
                                            src={e.embedUrl}
                                            title={`embed-${e.provider}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative w-full" style={{ paddingTop: pad }}>
                                        <iframe
                                            key={iframeKey}
                                            className="absolute inset-0 h-full w-full"
                                            src={e.embedUrl}
                                            title={`embed-${e.provider}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            loading="lazy"
                                        />
                                    </div>
                                )}

                                <div className="px-3 py-2 text-[11px] text-slate-300">
                                    Preview:{" "}
                                    <a
                                        href={e.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-slate-100"
                                        onClick={(ev) => ev.stopPropagation()}
                                    >
                                        {e.url}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ===========================
 *  PostCard
 * =========================== */

export function PostCard({
    session,
    post,
    variant = "card",
    openCommentsInPage = false,
    enablePolling = false,
    enableOwnerControls = false,
    onOpenDetail,
    enableToView,
    showOwnerPanel,
    selectedViewMode,
    wallContext,
    embedded,
    hideFooterActions = false,
}: {
    session: any;
    post: Post;
    variant?: "card" | "detail";
    openCommentsInPage?: boolean;
    enablePolling?: boolean;
    enableOwnerControls?: boolean;
    onOpenDetail?: (postId: number) => void;
    enableToView?: EnableToView | null;
    showOwnerPanel?: boolean;
    selectedViewMode?: number;
    wallContext?: WallContext;
    embedded?: boolean;
    hideFooterActions?: boolean;
}) {
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [expandedCommentId, setExpandedCommentId] = useState<number | null>(null);
    const toggleComment = (id: number) => setExpandedCommentId((prev) => (prev === id ? null : id));

    const [newComment, setNewComment] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentMsg, setCommentMsg] = useState<string | null>(null);
    const [commentsExpanded, setCommentsExpanded] = useState(false);

    const commentRefs = useRef<Record<number, HTMLDivElement | null>>({});

    type LocalPostComment = PostComment & { __optimistic?: boolean; __error?: string | null };

    const [currentPost, setCurrentPost] = useState<Post>(post);

    const [visibilityMenu, setVisibilityMenu] = useState(false);
    const [ownerActionsLoading, setOwnerActionsLoading] = useState(false);

    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [actionPostId, setActionPostId] = useState<number | null>(null);

    const [enableToViewState, setEnableToViewState] = useState<EnableToView | null | undefined>(enableToView);
    const [showOwnerPanelState, setShowOwnerPanelState] = useState<boolean | undefined>(
        showOwnerPanel ? showOwnerPanel : true
    );
    const [selectedViewModeState, setSelectedViewModeState] = useState<number>(selectedViewMode ? selectedViewMode : 0);

    const [shareOpen, setShareOpen] = useState(false);

    /* ===========================
     *  Interests tracking (MVP)
     * =========================== */

    const trackInterestEvent = async (payload: { postId: number; type: "view" | "like" | "own_post"; dwellMs?: number }) => {
        try {
            await fetch("/api/interests/event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                keepalive: true,
            });
        } catch {
            // noop
        }
    };

    // Dedupe: no spamear "view" si re-renderiza el detail
    const viewedRef = useRef<Record<number, boolean>>({});

    const canViewFunction = (selectedViewMode: number, postVisibility: number): boolean => {
        if (selectedViewMode === 0) return true;
        if (postVisibility === 1) return true;
        if (selectedViewMode > 2 && postVisibility === 2) return true;
        if (selectedViewMode === postVisibility) return true;
        if (selectedViewMode === 4 && postVisibility === 3) return true;
        return false;
    };

    const [canViewState, setCanViewState] = useState<boolean>(canViewFunction(selectedViewModeState, currentPost.visibility));

    useEffect(() => {
        setEnableToViewState(enableToView);
        setShowOwnerPanelState(showOwnerPanel);
        setSelectedViewModeState(selectedViewMode ? selectedViewMode : 0);
        setCanViewState(canViewFunction(selectedViewMode ? selectedViewMode : 0, currentPost.visibility));
    }, [enableToView, showOwnerPanel, selectedViewMode, currentPost.visibility]);

    useEffect(() => {
        setCurrentPost(post);
    }, [post]);

    const [localComments, setLocalComments] = useState<LocalPostComment[]>((post.post_comment ?? []) as LocalPostComment[]);

    useEffect(() => {
        setLocalComments((prev) => {
            const fromServer = (currentPost.post_comment ?? []) as LocalPostComment[];
            const prevById = new Map(prev.map((c) => [c.id, c]));

            const mergedFromServer = fromServer.map((c) => {
                const old = prevById.get(c.id);
                return {
                    ...old,
                    ...c,
                    user: c.user ?? old?.user ?? c.user,
                    __optimistic: false,
                    __error: null,
                };
            });

            const serverIds = new Set(fromServer.map((c) => c.id));
            const stillOptimistic = prev.filter((c) => c.__optimistic && !serverIds.has(c.id));
            return [...stillOptimistic, ...mergedFromServer];
        });
    }, [currentPost.post_comment, currentPost.id]);

    useEffect(() => {
        if (!currentPost?.id || !enablePolling) return;

        let cancelled = false;

        const fetchLatest = async () => {
            try {
                const res = await fetch(`/api/posts/${currentPost.id}`, { method: "GET", cache: "no-store" });
                if (!res.ok) return;
                const json = await res.json().catch(() => null);
                const fresh = json?.data as Post | undefined;
                if (!fresh) return;
                if (!cancelled) setCurrentPost(fresh);
            } catch { }
        };

        fetchLatest();
        const id = setInterval(fetchLatest, 30_000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [currentPost?.id, enablePolling]);

    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;
    const sessionUserName = session?.user?.name ?? "Tú";
    const sessionUserImageUrl = session?.user?.imageUrl ?? null;

    // ✅ Track "view" cuando se abre el modal/detail
    useEffect(() => {
        if (variant !== "detail") return;
        if (!currentPost?.id) return;
        if (!sessionUserId) return;

        const postId = currentPost.id;
        const t0 = performance.now();

        return () => {
            const dwellMs = Math.max(0, Math.round(performance.now() - t0));
            void trackInterestEvent({ postId, type: "view", dwellMs });
        };
    }, [variant, currentPost?.id, sessionUserId]);

    const canCreatePostComment = Boolean(session?.user?.id) && newComment.trim().length > 0 && !commentLoading;

    const submitPostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCreatePostComment || sessionUserId == null) return;

        const content = newComment.trim();
        setNewComment("");
        setCommentMsg(null);

        const tempId = -Date.now();

        const optimistic: LocalPostComment = {
            id: tempId,
            post_id: currentPost.id,
            comment: content,
            createdAt: new Date().toISOString(),
            who_comments: sessionUserId,
            active: 1,
            user: { id: sessionUserId, name: sessionUserName, imageUrl: sessionUserImageUrl },
            responses: [],
            __optimistic: true,
            __error: null,
        };

        setCommentsExpanded(true);
        setExpandedCommentId(tempId);
        setLocalComments((prev) => [optimistic, ...prev]);
        setCommentLoading(true);

        try {
            const res = await fetch("/api/post-comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ post_id: currentPost.id, comment: content }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "No se pudo guardar el comentario");

            const created = data?.data as PostComment;
            const realId = created.id;

            setLocalComments((prev) =>
                prev.map((c) =>
                    c.id === tempId ? { ...c, id: created.id, createdAt: created.createdAt, __optimistic: false, __error: null } : c
                )
            );

            setExpandedCommentId((prev) => (prev === tempId ? realId : prev));
            setCommentMsg("Comentario guardado ✅");
        } catch (err: any) {
            const msg = err?.message ?? "Error";
            setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
            setCommentMsg(msg);
        } finally {
            setCommentLoading(false);
        }
    };

    const viewerIdRaw = session?.user?.id;
    const viewerIdParsed = viewerIdRaw != null ? parseInt(String(viewerIdRaw), 10) : null;
    const viewerId = viewerIdParsed != null && Number.isFinite(viewerIdParsed) ? viewerIdParsed : null;

    // ✅ FIX: el “owner del post” es el autor, NO el dueño del muro.
    const isOwner = viewerId !== null && viewerId === currentPost.authorId;

    const showToggleShowInFeed = Boolean(wallContext?.showToggleShowInFeed);
    const showInFeedLoading = Boolean(wallContext?.showInFeedLoading);
    const handleToggleShowInFeed = async () => {
        if (!showToggleShowInFeed) return;
        if (showInFeedLoading) return;
        await wallContext?.onToggleShowInFeed?.();
    };

    const author = currentPost.author ?? null;
    const isDeleted = Boolean(currentPost.deletedAt);

    const rel = currentPost.relations ?? {
        following: false,
        isFollower: false,
        likesCount: 0,
        unlikesCount: 0,
        userReaction: null,
        relState: 1 as any,
    };

    const [postReaction, setPostReaction] = useState<Reaction>(rel.userReaction ?? null);
    const [likesCount, setLikesCount] = useState<number>(rel.likesCount ?? 0);
    const [unlikesCount, setUnlikesCount] = useState<number>(rel.unlikesCount ?? 0);

    useEffect(() => {
        const r = currentPost.relations as PostRelations | undefined;
        setPostReaction(r?.userReaction ?? null);
        setLikesCount(r?.likesCount ?? 0);
        setUnlikesCount(r?.unlikesCount ?? 0);
    }, [currentPost.id, currentPost.relations?.userReaction, currentPost.relations?.likesCount, currentPost.relations?.unlikesCount]);

    const [reactionLoading, setReactionLoading] = useState(false);
    const canReact = Boolean(sessionUserId) && !reactionLoading;

    const updateCountsOptimistic = (prev: Reaction, next: Reaction) => {
        setLikesCount((prevLikes) => {
            let v = prevLikes;
            if (prev === "LIKE") v -= 1;
            if (next === "LIKE") v += 1;
            return v < 0 ? 0 : v;
        });

        setUnlikesCount((prevUnlikes) => {
            let v = prevUnlikes;
            if (prev === "UNLIKE") v -= 1;
            if (next === "UNLIKE") v += 1;
            return v < 0 ? 0 : v;
        });
    };

    const sendReaction = async (next: Reaction) => {
        if (!canReact || !currentPost.id) return;

        const prev = postReaction;

        setPostReaction(next);
        updateCountsOptimistic(prev, next);
        setReactionLoading(true);

        try {
            const res = await fetch(`/api/posts/${currentPost.id}/reaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: next }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                updateCountsOptimistic(next, prev);
                setPostReaction(prev);
                console.error(data?.error || "Error en reacción");
                return;
            }

            if (data?.counts) {
                setLikesCount(data.counts.likes ?? 0);
                setUnlikesCount(data.counts.unlikes ?? 0);
            }
            if (typeof data?.userReaction !== "undefined") {
                setPostReaction(data.userReaction as Reaction);

                // ✅ Track interest: solo cuando efectivamente quedó LIKE
                if (sessionUserId && data.userReaction === "LIKE" && prev !== "LIKE") {
                    void trackInterestEvent({ postId: currentPost.id, type: "like" });
                }
            }
        } catch (err) {
            updateCountsOptimistic(next, prev);
            setPostReaction(prev);
            console.error(err);
        } finally {
            setReactionLoading(false);
        }
    };

    const handleLike = () => {
        const next: Reaction = postReaction === "LIKE" ? null : "LIKE";
        sendReaction(next);
    };

    const handleUnlike = () => {
        const next: Reaction = postReaction === "UNLIKE" ? null : "UNLIKE";
        sendReaction(next);
    };

    const desc = (currentPost.description ?? "").trim();

    const shortDesc = useMemo(() => {
        if (!desc) return "Sin descripción (click para comentar)";
        if (desc.length <= 70) return desc;
        return desc.slice(0, 70) + "…";
    }, [desc]);

    const shownDesc = showFullDesc ? desc || "Sin descripción" : shortDesc;

    const activeCommentsCount = (() => {
        const activeLocal = (localComments ?? []).filter((c) => (c.active ?? 1) === 1).length;
        if (activeLocal > 0) return activeLocal;
        const fromPost = currentPost.commentsCount;
        return typeof fromPost === "number" ? fromPost : 0;
    })();

    const sortedImages = useMemo(
        () =>
            (currentPost.images ?? [])
                .filter((img) => !!img && !!img.imageUrl)
                .slice()
                .sort((a, b) => (a.index ?? 0) - (b.index ?? 0)),
        [currentPost.images]
    );

    const handleToggleActiveOwner = async () => {
        if (!enableOwnerControls || !isOwner) return;

        const prevActive = currentPost.active ?? 1;
        const nextActive = prevActive === 1 ? 0 : 1;

        setOwnerActionsLoading(true);
        try {
            await updatePostActive(currentPost.id, nextActive);
            setCurrentPost((prev) => (prev ? ({ ...prev, active: nextActive } as Post) : prev));
        } catch (err) {
            console.error("Error al actualizar active:", err);
        } finally {
            setOwnerActionsLoading(false);
        }
    };

    const handleChangeVisibilityOwner = async (value: PostVisibility) => {
        if (!enableOwnerControls || !isOwner) return;
        setOwnerActionsLoading(true);
        try {
            await updatePostVisibility(currentPost.id, value);
            setCurrentPost((prev) => (prev ? ({ ...prev, visibility: value } as Post) : prev));
            setVisibilityMenu(false);
        } catch (err) {
            console.error("Error al actualizar visibility:", err);
        } finally {
            setOwnerActionsLoading(false);
        }
    };

    const handleSoftDeleteOwner = async () => {
        if (!enableOwnerControls || !isOwner) return;
        setDeleteLoading(true);
        try {
            const res = await softDeletePost(currentPost.id);
            if ((res as any)?.error) {
                console.error((res as any).error);
            } else {
                setCurrentPost((prev) => (prev ? ({ ...prev, deletedAt: new Date().toISOString() } as Post) : prev));
            }
            setShowDeletePopup(false);
        } catch (err) {
            console.error("Error al eliminar (soft) post:", err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleRestore = () => {
        setActionPostId(currentPost.id);
        startTransition(async () => {
            const res = await restorePost(currentPost.id);
            if ((res as any)?.error) {
                console.error((res as any).error);
                setActionPostId(null);
                return;
            }

            try {
                const resPost = await fetch(`/api/posts/${currentPost.id}`, { method: "GET", cache: "no-store" });
                if (!resPost.ok) {
                    setActionPostId(null);
                    return;
                }
                const json = await resPost.json().catch(() => null);
                const fresh = json?.data as Post | undefined;
                if (fresh) setCurrentPost(fresh);
            } catch {
            } finally {
                setActionPostId(null);
            }
        });
    };

    const handleHardDelete = () => {
        const ok = window.confirm("¿Seguro que querés eliminar definitivamente este post? Esta acción no se puede deshacer.");
        if (!ok) return;

        setActionPostId(currentPost.id);
        startTransition(async () => {
            const res = await hardDeletePost(currentPost.id);
            if ((res as any)?.error) console.error((res as any).error);
            setActionPostId(null);
        });
    };

    const isActive = (currentPost.active ?? 1) === 1;

    const canView =
        isOwner ||
        currentPost.visibility === 1 ||
        (currentPost.visibility === 2 && viewerId !== null) ||
        (currentPost.visibility === 3 && viewerId !== null && (rel.relState === 8 || rel.following)) ||
        (currentPost.visibility === 4 && viewerId !== null && rel.relState === 8);

    if (isDeleted && !isOwner) {
        return (
            <div className="w-full rounded-lg bg-slate-900 border border-slate-800 shadow-sm px-3 py-2 text-slate-100">
                <div className="text-xs text-red-300">Este post fue eliminado por su autor.</div>
            </div>
        );
    }

    if (!canView) {
        const msg =
            currentPost.visibility === 2
                ? "Debes iniciar sesión para ver este post."
                : currentPost.visibility === 3
                    ? "Debes ser seguidor o amigo para poder ver este post."
                    : "Debes ser amigo para poder ver este post.";

        return (
            <div className="w-full rounded-lg bg-slate-900 border border-slate-800 shadow-sm px-3 py-2 text-slate-100">
                <div className="text-xs text-yellow-300">{msg}</div>
            </div>
        );
    }

    const handleCommentsClick = () => {
        if (onOpenDetail) {
            onOpenDetail(currentPost.id);
            return;
        }
        setCommentsExpanded((v) => !v);
    };

    const rootClass = embedded
        ? "w-full bg-transparent px-0 py-0 text-slate-100"
        : isDeleted
            ? "w-full rounded-lg bg-[rgb(64,20,20)] border rounded-xl border-red-600 shadow-sm px-3 py-2 text-red-100 pt-10 lg:py-2"
            : isActive
                ? "w-full rounded-lg bg-black border rounded-xl border-slate-800 shadow-sm px-3 py-2 text-slate-100 pt-10 lg:py-2"
                : "w-full rounded-lg bg-black border rounded-xl border-red-500 shadow-md px-3 py-2 text-gray-200 pt-10 lg:py-2";

    return (
        <>
            {((isActive && !isDeleted) || showOwnerPanelState) && canViewState && (
                <div className={rootClass}>
                    {isOwner && (
                        <OwnerToolbar
                            isOwner={isOwner}
                            isDeleted={isDeleted}
                            isActive={isActive}
                            showOwnerPanel={Boolean(showOwnerPanel)}
                            enableOwnerControls={Boolean(enableOwnerControls)}
                            postId={currentPost.id}
                            visibility={currentPost.visibility}
                            visibilityMenu={visibilityMenu}
                            setVisibilityMenu={setVisibilityMenu}
                            ownerActionsLoading={ownerActionsLoading}
                            onToggleActive={handleToggleActiveOwner}
                            onOpenDelete={() => setShowDeletePopup(true)}
                            onChangeVisibility={handleChangeVisibilityOwner}
                            onRestore={handleRestore}
                            onHardDelete={handleHardDelete}
                            isPending={isPending}
                            actionPostId={actionPostId}
                        />
                    )}

                    {isOwner && (
                        <DeleteConfirmModal
                            open={showDeletePopup}
                            onClose={() => setShowDeletePopup(false)}
                            onConfirm={handleSoftDeleteOwner}
                            loading={deleteLoading}
                        />
                    )}

                    {variant === "card" && author && (
                        <PostHeader
                            session={session}
                            user={author}
                            createdAt={currentPost.createdAt}
                            title={currentPost.title}
                            relations={currentPost.relations}
                            postId={currentPost.id}
                            onOpenDetail={onOpenDetail}
                        />
                    )}

                    {variant === "detail" ? (
                        <PostDetailLayout
                            session={session}
                            currentPost={currentPost}
                            isOwner={isOwner}
                            isDeleted={isDeleted}
                            isActive={isActive}
                            sortedImages={sortedImages}
                            enableMedia={Boolean(enableToViewState?.media)}
                            enablePostComments={Boolean(enableToViewState?.postComments)}
                            enablePostReplies={Boolean(enableToViewState?.postReplies)}
                            sessionUserId={sessionUserId}
                            shownDesc={shownDesc}
                            showFullDesc={showFullDesc}
                            onToggleDesc={() => setShowFullDesc((v) => !v)}
                            canReact={canReact}
                            postReaction={postReaction}
                            likesCount={likesCount}
                            unlikesCount={unlikesCount}
                            onLike={handleLike}
                            onUnlike={handleUnlike}
                            activeCommentsCount={activeCommentsCount}
                            localComments={localComments}
                            setLocalComments={setLocalComments}
                            expandedCommentId={expandedCommentId}
                            onToggleComment={toggleComment}
                            commentRefs={commentRefs}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            canCreatePostComment={canCreatePostComment}
                            commentLoading={commentLoading}
                            commentMsg={commentMsg}
                            submitPostComment={submitPostComment}
                            PostCardCommentsResponsesContainer={PostCardCommentsResponsesContainer}
                            ownerConfiguration={currentPost.ownerConfiguration}
                        />
                    ) : (
                        <>
                            <PostMedia
                                enableMedia={Boolean(enableToViewState?.media)}
                                selectedViewModeState={selectedViewModeState}
                                sortedImages={sortedImages}
                                sessionUserId={sessionUserId}
                                postId={currentPost.id}
                            />

                            {/* ✅ Descripción con links + embeds */}
                            <LinkifiedDescription
                                text={shownDesc}
                                onToggleExpand={() => setShowFullDesc((v) => !v)}
                                className="mt-2 text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
                                maxEmbeds={2}
                            />

                            <div className="mt-2 flex flex-row items-center gap-3">
                                {enableToViewState?.likes && (
                                    <PostReactions
                                        canReact={canReact}
                                        postReaction={postReaction}
                                        likesCount={likesCount}
                                        unlikesCount={unlikesCount}
                                        onLike={handleLike}
                                        onUnlike={handleUnlike}
                                    />
                                )}

                                {!hideFooterActions && sessionUserId != null && (
                                    <button
                                        type="button"
                                        onClick={() => setShareOpen(true)}
                                        className="mt-0 text-[11px] px-2 h-7 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-900 select-none w-fit"
                                        title="Compartir este post en el muro de un amigo"
                                    >
                                        Compartir con un amigo
                                    </button>
                                )}

                                {enableToViewState?.postComments && (
                                    <button
                                        type="button"
                                        onClick={handleCommentsClick}
                                        className="mt-0 text-xs text-gray-300 hover:text-gray-200 select-none w-fit"
                                    >
                                        {commentsExpanded ? (
                                            <div className="flex flex-row gap-1">
                                                <span>Ocultar</span>
                                                <MessageCircleOff className="w-5 h-5 text-gray-400 hover:text-gray-100" />
                                                <span>{activeCommentsCount}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-row gap-1">
                                                <span>Ver</span>
                                                <MessageCircle className="w-5 h-5 text-gray-400 hover:text-gray-100" />
                                                <span>{activeCommentsCount}</span>
                                            </div>
                                        )}
                                    </button>
                                )}

                                {!hideFooterActions && showToggleShowInFeed && (
                                    <button
                                        type="button"
                                        onClick={handleToggleShowInFeed}
                                        disabled={showInFeedLoading}
                                        className="mt-0 text-[11px] px-2 h-7 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-900 select-none w-fit"
                                        title={wallContext?.showInFeed ? "Ocultar este post del inicio" : "Mostrar este post en el inicio"}
                                    >
                                        {showInFeedLoading ? "Guardando…" : wallContext?.showInFeed ? "Ocultar del inicio" : "Mostrar en inicio"}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            <ShareWithFriendModal open={shareOpen} onClose={() => setShareOpen(false)} postId={currentPost.id} />
        </>
    );
}