// src/components/custom/postCardCommentsContainer.tsx
"use client";

import type { Dispatch, SetStateAction, RefObject } from "react";
import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import {
    ThumbsUp,
    ThumbsDown,
    ArrowUp,
    ArrowUpToLine,
    MessageCircle,
    MessageCircleOff,
    MoreHorizontal,
    Trash2,
    Flag,
} from "lucide-react";

import AutoResizeTextarea from "./AutoResizeTextarea";
import type { PostCardCommentsResponsesContainerProps } from "./postCardCommentsResponsesContainer";
import { pluralRespuestas } from "@/lib/text/plurals";
import { REPORT_REASONS, type ReportReason } from "@/lib/reportReasons";
import { Textarea } from "@/components/ui/textarea";

// shadcn/ui
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type LocalPostComment = PostComment & {
    __optimistic?: boolean;
    __error?: string | null;
};

type CommentReaction = "LIKE" | "UNLIKE" | null;

interface PostCardCommentsContainerProps {
    session: any;
    sessionUserId: number | null;

    // ✅ NUEVO
    postOwnerId: number;

    localComments: LocalPostComment[];
    setLocalComments: Dispatch<SetStateAction<LocalPostComment[]>>;

    expandedCommentId: number | null;
    onToggleComment: (id: number) => void;

    commentRefs: RefObject<Record<number, HTMLDivElement | null>>;

    newComment: string;
    setNewComment: (value: string) => void;
    canCreatePostComment: boolean;
    commentLoading: boolean;
    commentMsg: string | null;
    submitPostComment: (e: React.FormEvent) => Promise<void>;

    PostCardCommentsResponsesContainer: React.ComponentType<PostCardCommentsResponsesContainerProps>;
}

const PostCardCommentsContainer = ({
    session,
    sessionUserId,
    postOwnerId,
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
}: PostCardCommentsContainerProps) => {
    const [expandedResponsesByComment, setExpandedResponsesByComment] = useState<Record<number, boolean>>({});

    // ✅ Report dialog state (para comments: mandar details)
    const [reportOpen, setReportOpen] = useState(false);
    const [reportTargetId, setReportTargetId] = useState<number | null>(null);
    const [reportReason, setReportReason] = useState<ReportReason | null>(null);
    const [reportDetails, setReportDetails] = useState("");

    const [openMenuCommentId, setOpenMenuCommentId] = useState<number | null>(null);


    const openReport = (targetId: number, reason: ReportReason) => {
        // 🔒 cerrá el dropdown/sub sí o sí
        setOpenMenuCommentId(null);

        // setear data
        setReportTargetId(targetId);
        setReportReason(reason);
        setReportDetails("");

        // 🕒 abrir el dialog en el próximo tick para que Radix
        // desmonte el dropdown y retire su layer
        setTimeout(() => setReportOpen(true), 0);
    };

    const closeReport = () => {
        setReportOpen(false);
        setReportTargetId(null);
        setReportReason(null);
        setReportDetails("");
    };


    const submitReport = async () => {
        if (!sessionUserId) return;
        if (!reportTargetId || !reportReason) return;
        closeReport();
        try {
            const res = await fetch(`/api/post-comments/${reportTargetId}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reason: reportReason,
                    details: reportDetails,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) console.error(data?.error || "No se pudo denunciar");
        } catch (err) {
            console.error(err);

        }
    };

    const toggleResponses = (commentId: number) => {
        setExpandedResponsesByComment((prev) => ({
            ...prev,
            [commentId]: !(prev[commentId] ?? false),
        }));
    };

    const isLogged = Boolean(session?.user?.id);
    const sessionUserName = session?.user?.name ?? null;
    const sessionUserImageUrl = session?.user?.imageUrl ?? null;

    const activeComments = (localComments ?? [])
        .filter((c) => (c.active ?? 1) === 1)
        .slice()
        .sort((a, b) => {
            const at = Date.parse(a.createdAt) || 0;
            const bt = Date.parse(b.createdAt) || 0;
            return bt - at;
        });

    const softDeleteComment = async (commentId: number) => {
        const res = await fetch(`/api/post-comments/${commentId}/deactivate`, {
            method: "POST",
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "No se pudo eliminar el comentario");

        // ✅ actualizar UI sin polling
        setLocalComments((prev) =>
            prev.map((c) => (c.id === commentId ? { ...c, active: 0 } : c))
        );
    };

    /*
        const reportComment = async (commentId: number, reason: ReportReason) => {
            if (!sessionUserId) return;
    
            try {
                const res = await fetch(`/api/post-comments/${commentId}/report`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason }),
                });
    
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    console.error(data?.error || "No se pudo denunciar");
                    return;
                }
                // opcional: toast o msg
            } catch (err) {
                console.error(err);
            }
        };
    */
    return (
        <div className="mt-3 flex flex-col gap-4 h-auto overflow-y-auto">
            {/* 🔹 Textarea para comentar el post */}
            <div className="mb-2">
                {sessionUserId != null ? (
                    <form onSubmit={submitPostComment} className="flex flex-row h-full gap-1 px-1 pt-1">
                        <AutoResizeTextarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={1}
                            placeholder="Escribí un comentario..."
                        />

                        <div className="flex flex-row items-center justify-center w-5 h-5 border rounded-[6px]">
                            <button
                                type="submit"
                                disabled={!canCreatePostComment}
                                className="flex flex-row items-center justify-center text-sm text-gray-300 hover:text-gray-200 select-none"
                            >
                                {commentLoading ? (
                                    <ArrowUpToLine className="w-5 h-5 text-gray-400 hover:text-gray-100" />
                                ) : (
                                    <ArrowUp className="w-5 h-5 text-gray-400 hover:text-gray-100" />
                                )}
                            </button>
                        </div>

                        {commentMsg && (
                            <span
                                className={
                                    commentMsg.includes("✅")
                                        ? "text-green-400 text-[10px] px-1"
                                        : "text-red-400 text-[10px] px-1"
                                }
                            >
                                {commentMsg}
                            </span>
                        )}
                    </form>
                ) : (
                    <div className="text-sm text-gray-400">Iniciá sesión para comentar.</div>
                )}

                {commentMsg && commentMsg.includes("❌") && (
                    <span className="text-red-400 text-[10px] px-1">No se pudo enviar el comentario</span>
                )}
            </div>

            {/* 🔹 Lista de comentarios */}
            {activeComments.map((comment) => {
                const responsesCount = (comment.responses ?? []).filter((r) => (r.active ?? 1) === 1).length;
                const responsesExpanded = expandedResponsesByComment[comment.id] ?? false;

                const commentOwnerId = comment.who_comments ?? comment.user?.id ?? null;
                const isCommentOwner = sessionUserId != null && commentOwnerId === sessionUserId;
                const isPostOwner = sessionUserId != null && postOwnerId === sessionUserId;

                const isDisabled = Boolean(comment.__optimistic);

                const canDelete =
                    !isDisabled && (isPostOwner || isCommentOwner);

                const canReport =
                    !isDisabled && isLogged && !isCommentOwner;



                return (
                    <div
                        key={comment.id}
                        ref={(el) => {
                            if (commentRefs.current) commentRefs.current[comment.id] = el;
                        }}
                        className="border border-slate-900 rounded-xl p-2 scroll-mt-24"
                    >
                        {comment.__optimistic && (
                            <div className="text-[11px] text-gray-400 mb-1">Enviando…</div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <SingleCommentWithReply
                                    disabled={Boolean(comment.__optimistic)}
                                    onClickExpand={() => onToggleComment(comment.id)}
                                    showFullDesc={expandedCommentId === comment.id}
                                    shownDesc={comment.comment}
                                    isLogged={isLogged}
                                    sessionUserId={sessionUserId}
                                    commentId={comment.id}
                                    commentUser={comment.user}
                                    likesCount={comment.likesCount ?? 0}
                                    unlikesCount={comment.unlikesCount ?? 0}
                                    userReaction={comment.userReaction ?? null}
                                    responsesCount={responsesCount}
                                    responsesExpanded={responsesExpanded}
                                    onToggleResponses={() => toggleResponses(comment.id)}
                                />
                            </div>

                            {/* ⋯ acciones comment */}
                            {(canDelete || canReport) && (
                                <DropdownMenu
                                    open={openMenuCommentId === comment.id}
                                    onOpenChange={(open) => setOpenMenuCommentId(open ? comment.id : null)}
                                >

                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                            title="Acciones"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        align="end"
                                        className="bg-black border border-neutral-800 text-gray-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {canDelete && (
                                            <DropdownMenuItem
                                                onClick={() => softDeleteComment(comment.id)}
                                                className="cursor-pointer focus:bg-white/5"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        )}

                                        {canDelete && canReport && <DropdownMenuSeparator className="bg-neutral-800" />}

                                        {canReport && (
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger className="cursor-pointer focus:bg-white/5">
                                                    <Flag className="w-4 h-4 mr-2" />
                                                    Denunciar
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent className="bg-black border border-neutral-800 text-gray-200">
                                                    {REPORT_REASONS.map((r) => (
                                                        <DropdownMenuItem
                                                            key={r.value}
                                                            onClick={() => openReport(comment.id, r.value)}

                                                            className="cursor-pointer focus:bg-white/5"
                                                        >
                                                            {r.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

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
                            expanded={responsesExpanded}
                            onExpandedChange={(next: boolean) =>
                                setExpandedResponsesByComment((prev) => ({ ...prev, [comment.id]: next }))
                            }
                            showToggleButton={false}
                            // ✅ NUEVO
                            postOwnerId={postOwnerId}
                        />
                    </div>
                );
            })}

            {activeComments.length === 0 && (
                <div className="text-xs text-gray-400">Aún no hay comentarios. ¡Sé el primero en comentar!</div>
            )}
            {/* ✅ Dialog de denuncia (comment) */}
            <Dialog
                open={reportOpen}
                onOpenChange={(open) => {
                    setReportOpen(open);
                    if (!open) {
                        setReportTargetId(null);
                        setReportReason(null);
                        setReportDetails("");
                    }
                }}
            >

                <DialogContent
                    className="bg-black border border-neutral-800 text-gray-200"
                >
                    <DialogHeader>
                        <DialogTitle>Denunciar comentario</DialogTitle>
                    </DialogHeader>

                    <div className="text-xs text-gray-400">
                        Motivo:{" "}
                        <span className="text-gray-200">
                            {REPORT_REASONS.find((x) => x.value === reportReason)?.label ?? ""}
                        </span>
                    </div>

                    <div className="mt-2">
                        <Textarea
                            value={reportDetails}
                            maxLength={500}
                            placeholder="Podés explicar brevemente (opcional)"
                            onChange={(e) => setReportDetails(e.target.value)}
                            className="bg-neutral-950 border-neutral-800"
                        />
                        <div className="mt-1 text-[10px] text-gray-500 text-right">
                            {reportDetails.length}/500
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={closeReport}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={submitReport}>Enviar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PostCardCommentsContainer;

/* ============================================================
   Componente interno: un solo comentario + like/unlike
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
    responsesCount,
    responsesExpanded,
    onToggleResponses,
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
    userReaction: "LIKE" | "UNLIKE" | null;

    responsesCount: number;
    responsesExpanded: boolean;
    onToggleResponses: () => void;
}) => {
    const [reaction, setReaction] = useState<"LIKE" | "UNLIKE" | null>(userReaction);
    const [likesCountState, setLikesCountState] = useState<number>(likesCount);
    const [unlikesCountState, setUnlikesCountState] = useState<number>(unlikesCount);
    const [reactionLoading, setReactionLoading] = useState(false);

    useEffect(() => {
        setReaction(userReaction);
        setLikesCountState(likesCount);
        setUnlikesCountState(unlikesCount);
    }, [commentId, userReaction, likesCount, unlikesCount]);

    const canReact = !disabled && isLogged && sessionUserId != null && !reactionLoading;

    const updateCountsOptimistic = (prev: CommentReaction, next: CommentReaction) => {
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
        setReaction(next);
        updateCountsOptimistic(prev, next);
        setReactionLoading(true);

        try {
            const res = await fetch(`/api/post-comments/${commentId}/reaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: next }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                updateCountsOptimistic(next, prev);
                setReaction(prev);
                console.error(data?.error || "Error en reacción de comentario");
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
            <div className={["flex items-start gap-2 w-full select-none", disabled ? "opacity-60" : ""].join(" ")}>
                {/* Avatar */}
                {userId ? (
                    <Link
                        href={`/wall/${userId}`}
                        title="Ver muro"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                    >
                        <div className="relative w-7 h-7 mt-[2px] rounded-full overflow-hidden bg-neutral-800 border border-neutral-700">
                            {imageUrl ? (
                                <Image src={imageUrl} alt={name} fill sizes="28px" className="object-cover" />
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
                            <Image src={imageUrl} alt={name} fill sizes="28px" className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                                {name.slice(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <div className="text-sm leading-5 flex flex-col">
                        {/* Nombre */}
                        {userId ? (
                            <Link
                                href={`/wall/${userId}`}
                                title="Ver muro"
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-200 font-medium text-[10px]"
                            >
                                {name}:
                            </Link>
                        ) : (
                            <span className="text-gray-200 font-medium text-[10px]">{name}</span>
                        )}

                        {disabled && <span className="text-[11px] text-gray-400"> · Enviando…</span>}

                        {/* Texto del comentario */}
                        <span
                            onClick={() => {
                                if (disabled) return;
                                onClickExpand();
                            }}
                            title={commentTitle}
                            className={[
                                "text-gray-200 font-normal whitespace-pre-wrap break-words text-[14px]",
                                disabled ? "cursor-not-allowed" : "cursor-pointer",
                            ].join(" ")}
                        >
                            {shownDesc}
                        </span>
                    </div>

                    {/* ⭐ Barra de reacciones del comentario */}
                    <div className="mt-1 flex flex-row items-center gap-2 text-[11px]">
                        <button
                            type="button"
                            onClick={handleLike}
                            disabled={!canReact}
                            className="flex flex-row items-center gap-1 px-2 py-0.5 h-4"
                        >
                            <ThumbsUp
                                className={[
                                    "w-3 h-3",
                                    reaction === "LIKE" ? "text-green-500" : "text-gray-300",
                                    !canReact ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                                ].join(" ")}
                            />
                            <span>{likesCountState}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleUnlike}
                            disabled={!canReact}
                            className="flex flex-row items-center gap-1 px-2 py-0.5 h-4"
                        >
                            <ThumbsDown
                                className={[
                                    "w-3 h-3",
                                    reaction === "UNLIKE" ? "text-red-400" : "text-gray-300",
                                    !canReact ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                                ].join(" ")}
                            />
                            <span>{unlikesCountState}</span>
                        </button>

                        {/* botón expand respuestas */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (disabled) return;
                                onToggleResponses();
                            }}
                            disabled={disabled}
                            className="flex flex-row items-center gap-1 px-2 py-0.5 h-4 bg-transparent border-gray-600 text-gray-300 hover:text-gray-100 disabled:opacity-50"
                            title={responsesExpanded ? "Ocultar respuestas" : "Ver respuestas"}
                        >
                            {responsesExpanded ? (
                                <MessageCircleOff className="w-3 h-3" />
                            ) : (
                                <MessageCircle className="w-3 h-3" />
                            )}
                            <span className="text-[10px]">{pluralRespuestas(responsesCount)}</span>
                        </button>
                    </div>
                </div>
            </div>

            {disabled && (
                <div className="mt-2 text-xs text-gray-400">
                    Esperando confirmación… (no se puede reaccionar todavía)
                </div>
            )}
        </div>
    );
};

