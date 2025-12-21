// src/components/custom/postCardCommentsContainer.tsx
"use client";

import {
    Dispatch,
    SetStateAction,
    MutableRefObject,
    useState,
    useEffect,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import AutoResizeTextarea from "./AutoResizeTextarea";
import PostCardCommentsResponsesContainer from "./postCardCommetsResponsesContainer";

type LocalPostComment = PostComment & {
    __optimistic?: boolean;
    __error?: string | null;
};

type CommentReaction = "LIKE" | "UNLIKE" | null;

interface PostCardCommentsContainerProps {
    session: any;
    sessionUserId: number | null;

    localComments: LocalPostComment[];
    setLocalComments: Dispatch<SetStateAction<LocalPostComment[]>>;

    expandedCommentId: number | null;
    onToggleComment: (id: number) => void;

    commentRefs: MutableRefObject<Record<number, HTMLDivElement | null>>;

    newComment: string;
    setNewComment: (value: string) => void;
    canCreatePostComment: boolean;
    commentLoading: boolean;
    commentMsg: string | null;
    submitPostComment: (e: React.FormEvent) => Promise<void>;

    PostCardCommetsResponsesContainer: React.ComponentType<{
        commentId: number;
        responses: PostCommentResponse[];
        isLogged: boolean;
        sessionUserId: number | null;
        sessionUserName: string | null;
        sessionUserImageUrl: string | null;
        disabled: boolean;
        autoExpandOnNew?: boolean;
        autoScrollOnNew?: boolean;
        onCreated?: (created: PostCommentResponse) => void;
    }>;
}

const PostCardCommentsContainer = ({
    session,
    sessionUserId,
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
    PostCardCommetsResponsesContainer,
}: PostCardCommentsContainerProps) => {
    const isLogged = Boolean(session?.user?.id);
    const sessionUserName = session?.user?.name ?? null;
    const sessionUserImageUrl = session?.user?.imageUrl ?? null;

    const activeComments = (localComments ?? []).filter(
        (c) => (c.active ?? 1) === 1
    );

    return (
        <div className="mt-3 flex flex-col gap-3 h-auto overflow-y-auto border border-blue-500">
            {/* 🔹 Textarea para comentar el post */}
            <div className="mb-2">
                {sessionUserId != null ? (
                    <form onSubmit={submitPostComment} className="space-y-2">
                        <AutoResizeTextarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={1}
                            placeholder="Escribí un comentario..."
                            className="w-full rounded-md bg-neutral-900 text-gray-100 border border-neutral-700 p-2 outline-none focus:border-neutral-500 text-sm"
                        />

                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={!canCreatePostComment}
                                className="px-3 py-1.5 rounded-md bg-neutral-800 text-gray-100 border border-neutral-700 disabled:opacity-50"
                            >
                                {commentLoading ? "Guardando..." : "Comentar"}
                            </button>

                            {commentMsg && (
                                <span
                                    className={
                                        commentMsg.includes("✅")
                                            ? "text-green-400 text-sm"
                                            : "text-red-400 text-sm"
                                    }
                                >
                                    {commentMsg}
                                </span>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="text-sm text-gray-400">
                        Iniciá sesión para comentar.
                    </div>
                )}
            </div>

            {/* 🔹 Lista de comentarios */}
            {activeComments.map((comment) => (
                <div
                    key={comment.id}
                    ref={(el) => {
                        commentRefs.current[comment.id] = el;
                    }}
                    className="border border-neutral-800 rounded-md p-2 scroll-mt-24"
                >
                    {comment.__optimistic && (
                        <div className="text-[11px] text-gray-400 mb-1">
                            Enviando…
                        </div>
                    )}

                    <SingleCommentWithReply
                        disabled={Boolean(comment.__optimistic)}
                        onClickExpand={() => onToggleComment(comment.id)}
                        showFullDesc={expandedCommentId === comment.id}
                        shownDesc={comment.comment}
                        isLogged={isLogged}
                        sessionUserId={sessionUserId}
                        commentId={comment.id}
                        commentUser={comment.user}
                        // 🔹 iniciales para likes/unlikes/reacción
                        likesCount={comment.likesCount ?? 0}
                        unlikesCount={comment.unlikesCount ?? 0}
                        userReaction={comment.userReaction ?? null}
                    />

                    <PostCardCommentsResponsesContainer
                        commentId={comment.id}
                        responses={comment.responses ?? []}
                        isLogged={isLogged}
                        sessionUserId={sessionUserId}
                        sessionUserName={sessionUserName}
                        sessionUserImageUrl={sessionUserImageUrl}
                        disabled={Boolean(comment.__optimistic)}
                        autoExpandOnNew
                        autoScrollOnNew
                        onCreated={(created: PostCommentResponse) => {
                            setLocalComments((prev) =>
                                prev.map((c) =>
                                    c.id === comment.id
                                        ? {
                                            ...c,
                                            responses: [
                                                ...(c.responses ?? []),
                                                created,
                                            ],
                                        }
                                        : c
                                )
                            );
                        }}
                    />
                </div>
            ))}

            {activeComments.length === 0 && (
                <div className="text-xs text-gray-400">
                    Aún no hay comentarios. ¡Sé el primero en comentar!
                </div>
            )}
        </div>
    );
};

export default PostCardCommentsContainer;

/* ============================================================
   Componente interno: un solo comentario + respuesta + like/unlike
   ============================================================ */

const SingleCommentWithReply = ({
    disabled = false,
    onClickExpand,
    showFullDesc,
    shownDesc,
    isLogged,
    sessionUserId,
    commentId,
    commentUser,
    likesCount,
    unlikesCount,
    userReaction,
}: {
    disabled?: boolean;
    onClickExpand: () => void;
    showFullDesc: boolean;
    shownDesc: string;

    isLogged: boolean;
    sessionUserId: number | null;
    commentId: number;
    commentUser?: MiniUser | null;

    likesCount: number;
    unlikesCount: number;
    userReaction: CommentReaction;
}) => {
    // 👉 Estado para RESPUESTAS
    const [reply, setReply] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // 👉 Estado para REACCIONES (like/unlike)
    const [reaction, setReaction] = useState<CommentReaction>(userReaction);
    const [likesCountState, setLikesCountState] =
        useState<number>(likesCount);
    const [unlikesCountState, setUnlikesCountState] =
        useState<number>(unlikesCount);
    const [reactionLoading, setReactionLoading] = useState(false);

    // Sincronizar cuando el comentario se refresca por polling
    useEffect(() => {
        setReaction(userReaction);
        setLikesCountState(likesCount);
        setUnlikesCountState(unlikesCount);
    }, [commentId, userReaction, likesCount, unlikesCount]);

    const canSubmit =
        !disabled &&
        isLogged &&
        sessionUserId != null &&
        reply.trim().length > 0 &&
        !replyLoading;

    const canReact =
        !disabled && isLogged && sessionUserId != null && !reactionLoading;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setReplyLoading(true);
        setMsg(null);

        try {
            const res = await fetch("/api/post-comment-responses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    post_comment_id: commentId,
                    response: reply.trim(),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(
                    data?.error || "No se pudo guardar la respuesta"
                );
            }

            setReply("");
            setMsg("Respuesta guardada ✅");
        } catch (err: any) {
            setMsg(err?.message ?? "Error");
        } finally {
            setReplyLoading(false);
        }
    };

    // ---------- Reacciones: helpers ----------
    const updateCountsOptimistic = (
        prev: CommentReaction,
        next: CommentReaction
    ) => {
        setLikesCountState((prevLikes) => {
            let v = prevLikes;
            if (prev === "LIKE") v -= 1;
            if (next === "LIKE") v += 1;
            return v < 0 ? 0 : v;
        });

        setUnlikesCountState((prevUnlikes) => {
            let v = prevUnlikes;
            if (prev === "UNLIKE") v -= 1;
            if (next === "UNLIKE") v += 1;
            return v < 0 ? 0 : v;
        });
    };

    const sendReaction = async (next: CommentReaction) => {
        if (!canReact) return;

        const prev = reaction;

        // UI optimista
        setReaction(next);
        updateCountsOptimistic(prev, next);
        setReactionLoading(true);

        try {
            const res = await fetch(
                `/api/post-comments/${commentId}/reaction`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: next }),
                }
            );

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                // revertir si falla
                updateCountsOptimistic(next, prev);
                setReaction(prev);
                console.error(
                    data?.error || "Error en reacción de comentario"
                );
                return;
            }

            if (data?.counts) {
                setLikesCountState(data.counts.likes ?? 0);
                setUnlikesCountState(data.counts.unlikes ?? 0);
            }
            if (typeof data?.userReaction !== "undefined") {
                setReaction(data.userReaction as CommentReaction);
            }
        } catch (err) {
            updateCountsOptimistic(next, prev);
            setReaction(prev);
            console.error(err);
        } finally {
            setReactionLoading(false);
        }
    };

    const handleLike = () => {
        const next: CommentReaction = reaction === "LIKE" ? null : "LIKE";
        sendReaction(next);
    };

    const handleUnlike = () => {
        const next: CommentReaction = reaction === "UNLIKE" ? null : "UNLIKE";
        sendReaction(next);
    };

    // ---------- Render ----------
    const name = commentUser?.name ?? "Usuario";
    const imageUrl = commentUser?.imageUrl ?? null;
    const userId = commentUser?.id ?? null;

    const commentTitle = disabled
        ? "Esperando confirmación del comentario..."
        : showFullDesc
            ? "Click para contraer"
            : "Click para ver completo";

    return (
        <div className="w-full">
            <div
                className={[
                    "flex items-start gap-2 w-full select-none",
                    disabled ? "opacity-60" : "",
                ].join(" ")}
            >
                {/* Avatar */}
                {userId ? (
                    <Link
                        href={`/profile?user_id=${userId}`}
                        title="Ver perfil"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                    >
                        <div className="relative w-7 h-7 mt-[2px] rounded-full overflow-hidden bg-neutral-800 border border-neutral-700">
                            {imageUrl ? (
                                <Image
                                    src={imageUrl}
                                    alt={name}
                                    fill
                                    sizes="28px"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                                    {name.slice(0, 1).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </Link>
                ) : (
                    <div
                        title="Usuario"
                        className="relative w-7 h-7 mt-[2px] rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0"
                    >
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={name}
                                fill
                                sizes="28px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                                {name.slice(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <div className="text-sm leading-5">
                        {/* Nombre */}
                        {userId ? (
                            <Link
                                href={`/profile?user_id=${userId}`}
                                title="Ver perfil"
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-200 font-medium hover:underline"
                            >
                                {name}: &rarr;
                            </Link>
                        ) : (
                            <span className="text-gray-200 font-medium">
                                {name}
                            </span>
                        )}

                        {disabled && (
                            <span className="text-[11px] text-gray-400">
                                {" "}
                                · Enviando…
                            </span>
                        )}

                        {/* Texto del comentario */}
                        <span
                            onClick={() => {
                                if (disabled) return;
                                onClickExpand();
                            }}
                            title={commentTitle}
                            className={[
                                "text-gray-200 font-normal whitespace-pre-wrap break-words",
                                disabled
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer",
                            ].join(" ")}
                        >
                            {" "}
                            {shownDesc}
                        </span>
                    </div>

                    {/* ⭐ Barra de reacciones del comentario */}
                    <div className="mt-1 flex flex-row items-center gap-2 text-[11px]">
                        <button
                            type="button"
                            onClick={handleLike}
                            disabled={!canReact}
                            className={`flex flex-row items-center gap-1 px-2 py-0.5 rounded border ${reaction === "LIKE"
                                ? "bg-green-700 border-green-400 text-white"
                                : "bg-transparent border-gray-600 text-gray-300"
                                } ${!canReact
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                        >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{likesCountState}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleUnlike}
                            disabled={!canReact}
                            className={`flex flex-row items-center gap-1 px-2 py-0.5 rounded border ${reaction === "UNLIKE"
                                ? "bg-red-700 border-red-400 text-white"
                                : "bg-transparent border-gray-600 text-gray-300"
                                } ${!canReact
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                        >
                            <ThumbsDown className="w-3 h-3" />
                            <span>{unlikesCountState}</span>
                        </button>
                    </div>
                </div>
            </div>

            {disabled && (
                <div className="mt-2 text-xs text-gray-400">
                    Esperando confirmación… (no se puede responder ni
                    reaccionar todavía)
                </div>
            )}

            {!disabled && showFullDesc && (
                <div className="mt-3">
                    {isLogged ? (
                        <form onSubmit={submit} className="space-y-2">
                            <AutoResizeTextarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                rows={1}
                                placeholder="Responder..."
                                className="w-full rounded-md bg-neutral-900 text-gray-100 border border-neutral-700 p-2 outline-none focus:border-neutral-500 text-sm"
                            />

                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="px-3 py-1.5 rounded-md bg-neutral-800 text-gray-100 border border-neutral-700 disabled:opacity-50"
                                >
                                    {replyLoading ? "Guardando..." : "Responder"}
                                </button>
                                {msg && (
                                    <span
                                        className={
                                            msg.includes("✅")
                                                ? "text-green-400 text-sm"
                                                : "text-red-400 text-sm"
                                        }
                                    >
                                        {msg}
                                    </span>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className="text-sm text-gray-400">
                            Iniciá sesión para responder.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

