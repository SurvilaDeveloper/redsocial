// src/app/components/custom/postCard/postDetailLayout.tsx
"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { PostHeader } from "./PostHeader";
import { PostReactions } from "./PostReactions";
import PostImageCard from "../PostImageCard";
import { ImagesSwiper } from "../ImagesSwiper";
import PostCardCommentsContainer from "../postCardCommentsContainer";
import type PostCardCommentsResponsesContainerType from "../postCardCommentsResponsesContainer";
import { FeedMessage } from "../feedMessage";
import type { Configuration } from "@/types/configuration";

/* ===========================
 *  Embeds helpers (detail)
 * =========================== */

type EmbedInfo = {
    url: string;
    embedUrl: string;
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

    // YouTube
    const yid = youtubeIdFrom(url);
    if (yid) {
        return {
            url: rawUrl,
            embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yid)}?rel=0&modestbranding=1`,
            provider: "youtube",
        };
    }

    // Vimeo
    const vid = vimeoIdFrom(url);
    if (vid) {
        return {
            url: rawUrl,
            embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(vid)}`,
            provider: "vimeo",
        };
    }

    // Twitch
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

    // Spotify
    if (host === "open.spotify.com") {
        return {
            url: rawUrl,
            embedUrl: `https://open.spotify.com/embed${url.pathname}`,
            provider: "spotify",
        };
    }

    // TikTok
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

    // Instagram
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

function buildEmbeds(desc: string): EmbedInfo[] {
    const urls = extractUrls(desc);
    if (!urls.length) return [];
    const e = toEmbed(urls[0]); // ✅ solo el primer link
    return e ? [e] : [];
}

function fixedHeight(provider: EmbedInfo["provider"]) {
    if (provider === "spotify") return 152;
    if (provider === "instagram") return 480;
    if (provider === "tiktok") return 560;
    return null;
}

function EmbedsLeftColumn({ embeds }: { embeds: EmbedInfo[] }) {
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

                    if (!entry.isIntersecting) {
                        setReloadNonce((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
                    }
                }
            },
            { threshold: 0, rootMargin: "0px 0px -15% 0px" }
        );

        for (const e of embeds) {
            const id = e.embedUrl;
            const node = hostRefs.current[id];
            if (node) obs.observe(node);
        }

        return () => obs.disconnect();
    }, [embeds]);

    if (!embeds.length) return null;

    return (
        <div className="flex flex-col gap-3">
            {embeds.map((e) => {
                const id = e.embedUrl;
                const nonce = reloadNonce[id] ?? 0;
                const iframeKey = `${id}::${nonce}`;
                const h = fixedHeight(e.provider);

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
                            <iframe
                                key={iframeKey}
                                className="w-full"
                                style={{ height: h }}
                                src={e.embedUrl}
                                title={`embed-${e.provider}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                loading="lazy"
                            />
                        ) : (
                            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
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
                            <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-100">
                                {e.url}
                            </a>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ===========================
 *  Types
 * =========================== */

type LocalPostComment = PostComment & {
    __optimistic?: boolean;
    __error?: string | null;
};

type Props = {
    session: any;
    currentPost: Post;

    ownerConfiguration?: Configuration | null;

    isOwner: boolean;
    isDeleted: boolean;
    isActive: boolean;

    // media
    sortedImages: NonNullable<Post["images"]>;
    enableMedia: boolean;
    sessionUserId: number | null;

    // desc
    shownDesc: string;
    showFullDesc: boolean;
    onToggleDesc: () => void;

    // reactions
    canReact: boolean;
    postReaction: Reaction;
    likesCount: number;
    unlikesCount: number;
    onLike: () => void;
    onUnlike: () => void;

    // comments
    activeCommentsCount: number;
    localComments: LocalPostComment[];
    setLocalComments: React.Dispatch<React.SetStateAction<LocalPostComment[]>>;
    expandedCommentId: number | null;
    onToggleComment: (id: number) => void;
    commentRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
    newComment: string;
    setNewComment: React.Dispatch<React.SetStateAction<string>>;
    canCreatePostComment: boolean;
    commentLoading: boolean;
    commentMsg: string | null;
    submitPostComment: (e: React.FormEvent) => Promise<void>;
    PostCardCommentsResponsesContainer: typeof PostCardCommentsResponsesContainerType | any;
    enablePostComments: boolean;
    enablePostReplies: boolean;
};

export function PostDetailLayout({
    session,
    currentPost,
    ownerConfiguration,
    isOwner,
    isDeleted,
    isActive,
    sortedImages,
    enableMedia,
    enablePostComments,
    enablePostReplies,
    sessionUserId,
    shownDesc,
    showFullDesc,
    onToggleDesc,
    canReact,
    postReaction,
    likesCount,
    unlikesCount,
    onLike,
    onUnlike,
    activeCommentsCount,
    localComments,
    setLocalComments,
    expandedCommentId,
    onToggleComment,
    commentRefs,
    newComment,
    setNewComment,
    canCreatePostComment,
    commentLoading,
    commentMsg,
    submitPostComment,
    PostCardCommentsResponsesContainer,
}: Props) {
    const ROOT_H = "lg:h-[calc(100dvh-70px)]";

    const descFull = (currentPost.description ?? "").trim();
    const embeds = useMemo(() => buildEmbeds(descFull), [descFull]);

    const hasImages = sortedImages.length > 0;
    const hasEmbeds = embeds.length > 0;

    // Caso sin imágenes ni embeds
    if (!hasImages && !hasEmbeds) {
        return (
            <div className={`m-0 flex flex-col lg:flex-row gap-4 ${ROOT_H} min-h-0 bg-slate-950 overflow-y-auto lg:overflow-hidden`}>
                <div className="w-full lg:flex lg:flex-row lg:justify-center lg:items-stretch min-h-0">
                    <div className="w-full lg:w-[45%] h-auto lg:h-full min-h-0 lg:border-l border-neutral-800 lg:pl-3 lg:pr-2 flex flex-col">
                        <div className="flex-1 min-h-0 overflow-visible lg:overflow-y-auto">
                            <section className="w-full flex flex-col gap-2 px-2 lg:px-0 pt-2">
                                {currentPost.author && (
                                    <PostHeader
                                        session={session}
                                        user={currentPost.author}
                                        createdAt={currentPost.createdAt}
                                        title={currentPost.title}
                                        relations={currentPost.relations}
                                        postId={currentPost.id}
                                    />
                                )}

                                <pre
                                    onClick={onToggleDesc}
                                    title={showFullDesc ? "Click para contraer" : "Click para ver completo"}
                                    className="mt-2 text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
                                >
                                    {shownDesc}
                                </pre>

                                <PostReactions
                                    canReact={canReact}
                                    postReaction={postReaction}
                                    likesCount={likesCount}
                                    unlikesCount={unlikesCount}
                                    onLike={onLike}
                                    onUnlike={onUnlike}
                                />
                            </section>

                            <section id="comments" className="w-full border-t border-neutral-800 pt-3 pb-6 px-2 lg:px-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-400">Comentarios ({activeCommentsCount})</span>
                                </div>

                                <PostCardCommentsContainer
                                    session={session}
                                    sessionUserId={sessionUserId}
                                    postOwnerId={currentPost.authorId}
                                    localComments={localComments}
                                    setLocalComments={setLocalComments}
                                    expandedCommentId={expandedCommentId}
                                    onToggleComment={onToggleComment}
                                    commentRefs={commentRefs}
                                    newComment={newComment}
                                    setNewComment={setNewComment}
                                    canCreatePostComment={canCreatePostComment}
                                    commentLoading={commentLoading}
                                    commentMsg={commentMsg}
                                    submitPostComment={submitPostComment}
                                    PostCardCommentsResponsesContainer={PostCardCommentsResponsesContainer}
                                />
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Caso con imágenes o embeds
    return (
        <div className={`m-0 flex flex-col lg:flex-row gap-4 ${ROOT_H} min-h-0 bg-slate-950 overflow-y-auto lg:overflow-hidden`}>
            {/* Header mobile */}
            <div className="lg:hidden block px-2">
                {currentPost.author && (
                    <PostHeader
                        session={session}
                        user={currentPost.author}
                        createdAt={currentPost.createdAt}
                        title={currentPost.title}
                        relations={currentPost.relations}
                        postId={currentPost.id}
                    />
                )}
            </div>

            {/* Columna izquierda */}
            <div className="lg:w-[55%] w-full h-auto lg:h-full min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 px-2 lg:px-0 flex flex-col gap-3 overflow-visible lg:overflow-y-auto lg:pr-2">
                    {hasEmbeds && <EmbedsLeftColumn embeds={embeds} />}

                    {enableMedia && hasImages && (
                        <section className="w-full flex flex-col gap-2 h-[80dvh]">
                            {sortedImages.length === 1 && (
                                <PostImageCard image={sortedImages[0]} sessionUserId={sessionUserId} isFirst />
                            )}

                            {sortedImages.length > 1 && (
                                <ImagesSwiper
                                    id={`post-${currentPost.id}`}
                                    imageArray={sortedImages as any}
                                    sessionUserId={sessionUserId}
                                    navigation="thumbnails"
                                    fit="height"
                                />
                            )}
                        </section>
                    )}
                </div>

                <div className="shrink-0 pt-2 px-2 lg:px-0 border-t border-neutral-800/60 bg-slate-950">
                    <PostReactions
                        canReact={canReact}
                        postReaction={postReaction}
                        likesCount={likesCount}
                        unlikesCount={unlikesCount}
                        onLike={onLike}
                        onUnlike={onUnlike}
                    />
                </div>
            </div>

            {/* Columna derecha */}
            <aside className="lg:w-[45%] w-full h-auto lg:h-full min-h-0 lg:border-l border-neutral-800 lg:pl-3 lg:pr-2 overflow-visible lg:overflow-y-auto">
                <div className="shrink-0 pt-2 px-2 lg:px-0">
                    {isDeleted && <p>Está eliminado</p>}

                    <div className="lg:block hidden">
                        {currentPost.author && (
                            <PostHeader
                                session={session}
                                user={currentPost.author}
                                createdAt={currentPost.createdAt}
                                title={currentPost.title}
                                relations={currentPost.relations}
                                postId={currentPost.id}
                            />
                        )}
                    </div>

                    <pre
                        onClick={onToggleDesc}
                        title={showFullDesc ? "Click para contraer" : "Click para ver completo"}
                        className="mt-2 text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
                    >
                        {shownDesc}
                    </pre>

                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Comentarios ({activeCommentsCount})</span>
                    </div>
                </div>

                <div className="px-2 lg:px-0 pb-4">
                    {enablePostComments ? (
                        <PostCardCommentsContainer
                            session={session}
                            sessionUserId={sessionUserId}
                            postOwnerId={currentPost.authorId}
                            localComments={localComments}
                            setLocalComments={setLocalComments}
                            expandedCommentId={expandedCommentId}
                            onToggleComment={onToggleComment}
                            commentRefs={commentRefs}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            canCreatePostComment={canCreatePostComment}
                            commentLoading={commentLoading}
                            commentMsg={commentMsg}
                            submitPostComment={submitPostComment}
                            PostCardCommentsResponsesContainer={PostCardCommentsResponsesContainer}
                        />
                    ) : (
                        <>
                            {ownerConfiguration?.postCommentsVisibility === 2 && (
                                <FeedMessage>Para poder ver los comentarios y comentar debes estar logueado.</FeedMessage>
                            )}
                            {ownerConfiguration?.postCommentsVisibility === 3 && (
                                <FeedMessage>
                                    Para poder ver los comentarios y comentar debes ser seguidor o amigo de este usuario.
                                </FeedMessage>
                            )}
                            {ownerConfiguration?.postCommentsVisibility === 4 && (
                                <FeedMessage>Para poder ver los comentarios y comentar debes ser amigo de este usuario.</FeedMessage>
                            )}
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}

