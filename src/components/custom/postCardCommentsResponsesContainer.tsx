// src/components/custom/postCardCommentsResponsesContainer.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AutoResizeTextarea from "./AutoResizeTextarea";
import {
    MessageCircle,
    MessageCircleOff,
    ThumbsUp,
    ThumbsDown,
    ArrowUp,
    ArrowUpToLine,
    MoreHorizontal,
    Trash2,
    Flag,
} from "lucide-react";

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

type CommentReaction = "LIKE" | "UNLIKE" | null;

type Props = {
    commentId: number;
    responses?: PostCommentResponse[];

    isLogged: boolean;
    sessionUserId: number | null;
    sessionUserName?: string | null;
    sessionUserImageUrl?: string | null;

    disabled?: boolean;
    onCreated?: (created: PostCommentResponse) => void;

    defaultExpanded?: boolean;
    autoExpandOnNew?: boolean;
    autoScrollOnNew?: boolean;

    expanded?: boolean;
    onExpandedChange?: (next: boolean) => void;
    showToggleButton?: boolean;

    // ✅ NUEVO
    postOwnerId: number;
};

export type PostCardCommentsResponsesContainerProps = Props;

type LocalResponse = PostCommentResponse & {
    __optimistic?: boolean;
};

export default function PostCardCommentsResponsesContainer({
    commentId,
    responses = [],
    isLogged,
    sessionUserId,
    sessionUserName,
    sessionUserImageUrl,
    disabled = false,
    onCreated,
    defaultExpanded = false,
    autoExpandOnNew = true,
    autoScrollOnNew = true,
    expanded: controlledExpanded,
    onExpandedChange,
    showToggleButton = true,
    postOwnerId,
}: Props) {
    const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);

    const expanded = typeof controlledExpanded === "boolean" ? controlledExpanded : uncontrolledExpanded;

    const setExpandedSafe = (next: boolean) => {
        if (typeof controlledExpanded === "boolean") {
            onExpandedChange?.(next);
        } else {
            setUncontrolledExpanded(next);
        }
    };

    const toggleExpanded = () => setExpandedSafe(!expanded);

    const [localResponses, setLocalResponses] = useState<LocalResponse[]>(responses);
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // ✅ Report dialog state (para mandar details)
    const [reportOpen, setReportOpen] = useState(false);
    const [reportTargetId, setReportTargetId] = useState<number | null>(null);
    const [reportReason, setReportReason] = useState<ReportReason | null>(null);
    const [reportDetails, setReportDetails] = useState("");

    const openReport = (targetId: number, reason: ReportReason) => {
        setReportTargetId(targetId);
        setReportReason(reason);
        setReportDetails("");
        setReportOpen(true);
    };

    const submitReport = async () => {
        if (!sessionUserId) return;
        if (!reportTargetId || !reportReason) return;

        try {
            const res = await fetch(`/api/post-comment-responses/${reportTargetId}/report`, {
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
        } finally {
            setReportOpen(false);
            setReportTargetId(null);
            setReportReason(null);
            setReportDetails("");
        }
    };

    useEffect(() => {
        setLocalResponses((prev) => {
            const prevById = new Map(prev.map((r) => [r.id, r]));
            return responses.map((r) => {
                const old = prevById.get(r.id);
                return { ...old, ...r, user: r.user ?? old?.user ?? r.user };
            });
        });
    }, [responses]);

    const activeSorted = useMemo(() => {
        return localResponses
            .filter((r) => (r.active ?? 1) === 1)
            .slice()
            .sort((a, b) => {
                const ta = Date.parse(a.createdAt);
                const tb = Date.parse(b.createdAt);
                return (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
            });
    }, [localResponses]);

    const count = activeSorted.length;

    const canSubmit =
        !disabled && isLogged && sessionUserId != null && reply.trim().length > 0 && !loading;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || sessionUserId == null) return;

        const content = reply.trim();
        setReply("");
        setMsg(null);

        if (autoExpandOnNew && !expanded) setExpandedSafe(true);

        const tempId = -Date.now();

        const optimistic: LocalResponse = {
            id: tempId,
            response: content,
            createdAt: new Date().toISOString(),
            who_responses: sessionUserId,
            active: 1,
            user: { id: sessionUserId, name: sessionUserName ?? "Tú", imageUrl: sessionUserImageUrl ?? null },
            __optimistic: true,
        };

        setLocalResponses((prev) => [...prev, optimistic]);
        setLoading(true);

        try {
            const res = await fetch("/api/post-comment-responses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ post_comment_id: commentId, response: content }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error("❌");

            const created = data?.data as PostCommentResponse | undefined;
            if (!created) throw new Error("Respuesta creada inválida");

            setLocalResponses((prev) =>
                prev.map((r) =>
                    r.id === tempId
                        ? { ...r, id: created.id, createdAt: created.createdAt, __optimistic: false, user: created.user ?? r.user }
                        : r
                )
            );

            setMsg("✅");
            onCreated?.(created);
        } catch (err: any) {
            setLocalResponses((prev) => prev.filter((r) => r.id !== tempId));
            setMsg(err?.message ?? "Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-2 ml-3 border-l border-neutral-700 pl-3 max-h-[300px] overflow-y-auto">
            {showToggleButton && (
                <button
                    type="button"
                    onClick={toggleExpanded}
                    className="text-xs text-gray-300 hover:text-gray-200 select-none"
                >
                    {expanded ? (
                        <div className="flex flex-row">
                            <MessageCircleOff className="w-6 h-6 text-gray-400 hover:text-gray-100" />
                            <span>{pluralRespuestas(activeSorted.length)}</span>
                        </div>
                    ) : (
                        <div className="flex flex-row">
                            <MessageCircle className="w-6 h-6 text-gray-400 hover:text-gray-100" />
                            <span>{pluralRespuestas(activeSorted.length)}</span>
                        </div>
                    )}
                </button>
            )}

            {expanded && (
                <div className="mt-2 flex flex-col gap-4">
                    {count === 0 ? (
                        <div className="text-xs text-gray-500">Sin respuestas todavía.</div>
                    ) : (
                        activeSorted.map((r) => (
                            <ResponseRow
                                key={r.id}
                                response={r}
                                sessionUserId={sessionUserId}
                                sessionUserName={sessionUserName}
                                sessionUserImageUrl={sessionUserImageUrl}
                                isLogged={isLogged}
                                disabled={disabled}
                                postOwnerId={postOwnerId}
                                onOpenReport={openReport}
                                onSoftDeleted={(id) => {
                                    setLocalResponses((prev) => prev.map((x) => (x.id === id ? { ...x, active: 0 } : x)));
                                }}
                            />
                        ))
                    )}

                    {disabled ? (
                        <div className="text-xs text-gray-400 mt-2">
                            Esperando confirmación del comentario… (no se puede responder todavía)
                        </div>
                    ) : isLogged ? (
                        <form onSubmit={submit} className="flex flex-row h-full gap-1 pr-1">
                            <AutoResizeTextarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                rows={1}
                                placeholder="Escribí una respuesta..."
                            />

                            <div className="flex flex-row items-center justify-center w-5 h-5 border rounded-[6px]">
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="flex flex-row items-center justify-center text-sm text-gray-300 hover:text-gray-200 select-none"
                                >
                                    {loading ? (
                                        <ArrowUpToLine className="w-5 h-5 text-gray-400 hover:text-gray-100" />
                                    ) : (
                                        <ArrowUp className="w-5 h-5 text-gray-400 hover:text-gray-100" />
                                    )}
                                </button>
                            </div>

                            {msg && <span className={msg.includes("✅") ? "text-green-400 text-sm" : "text-red-400 text-sm"}>{msg}</span>}
                        </form>
                    ) : (
                        <div className="text-xs text-gray-400 mt-2">Iniciá sesión para responder.</div>
                    )}

                    {msg && msg.includes("❌") && (
                        <span className="text-red-400 text-[10px]">No se pudo enviar la respuesta</span>
                    )}
                </div>
            )}
            {/* ✅ Dialog de denuncia (response) */}
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
                <DialogContent className="bg-black border border-neutral-800 text-gray-200">
                    <DialogHeader>
                        <DialogTitle>Denunciar respuesta</DialogTitle>
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
                        <Button type="button" variant="secondary" onClick={() => setReportOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={submitReport}>Enviar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ============================================================
   Fila individual de respuesta + likes/unlikes + menú acciones
   ============================================================ */

function ResponseRow({
    response,
    sessionUserId,
    sessionUserName,
    sessionUserImageUrl,
    isLogged,
    disabled,
    postOwnerId,
    onOpenReport,
    onSoftDeleted,
}: {
    response: LocalResponse;
    sessionUserId: number | null;
    sessionUserName?: string | null;
    sessionUserImageUrl?: string | null;
    isLogged: boolean;
    disabled: boolean;
    postOwnerId: number;
    onOpenReport: (targetId: number, reason: ReportReason) => void;
    onSoftDeleted: (id: number) => void;
}) {
    const isCurrentUser = response.who_responses === sessionUserId;

    const name =
        response.user?.name ?? (isCurrentUser && sessionUserName ? sessionUserName : "Usuario");

    const imageUrl =
        response.user?.imageUrl ?? (isCurrentUser ? sessionUserImageUrl ?? null : null);

    const userId = response.user?.id ?? (isCurrentUser ? sessionUserId : null);

    const [reaction, setReaction] = useState<CommentReaction>(response.userReaction ?? null);
    const [likesCount, setLikesCount] = useState<number>(response.likesCount ?? 0);
    const [unlikesCount, setUnlikesCount] = useState<number>(response.unlikesCount ?? 0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setReaction(response.userReaction ?? null);
        setLikesCount(response.likesCount ?? 0);
        setUnlikesCount(response.unlikesCount ?? 0);
    }, [response.id, response.userReaction, response.likesCount, response.unlikesCount]);

    const canReact = !disabled && isLogged && sessionUserId != null && !loading;

    const updateCountsOptimistic = (prev: CommentReaction, next: CommentReaction) => {
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

    const sendReaction = async (next: CommentReaction) => {
        if (!canReact) return;

        const prev = reaction;
        setReaction(next);
        updateCountsOptimistic(prev, next);
        setLoading(true);

        try {
            const res = await fetch(`/api/post-comment-responses/${response.id}/reaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: next }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                updateCountsOptimistic(next, prev);
                setReaction(prev);
                console.error(data?.error || "Error en reacción de respuesta");
                return;
            }

            if (data?.counts) {
                setLikesCount(data.counts.likes ?? 0);
                setUnlikesCount(data.counts.unlikes ?? 0);
            }
            if (typeof data?.userReaction !== "undefined") {
                setReaction(data.userReaction as CommentReaction);
            }
        } catch (err) {
            updateCountsOptimistic(next, prev);
            setReaction(prev);
            console.error(err);
        } finally {
            setLoading(false);
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

    const responseOwnerId = response.who_responses ?? response.user?.id ?? null;
    const isResponseOwner = sessionUserId != null && responseOwnerId === sessionUserId;
    const isPostOwner = sessionUserId != null && postOwnerId === sessionUserId;

    const canDelete = !disabled && !response.__optimistic && (isPostOwner || isResponseOwner);
    const canReport = isLogged && !disabled && !response.__optimistic && !isResponseOwner;

    const softDeleteResponse = async (responseId: number) => {
        const res = await fetch(`/api/post-comment-responses/${responseId}/deactivate`, {
            method: "POST",
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "No se pudo eliminar la respuesta");

        // ✅ avisar al padre
        onSoftDeleted(responseId);
    };



    /*const reportResponse = async (id: number, reason: ReportReason) => {
        if (!sessionUserId) return;

        try {
            const res = await fetch(`/api/post-comment-responses/${id}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) {
                console.error(data?.error || "No se pudo denunciar");
            }
        } catch (err) {
            console.error(err);
        }
    };*/

    // ✅ controlar dropdown open (para evitar que Radix deje un layer vivo)
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="text-sm text-gray-300">
            <div className="flex items-start gap-2 w-full">
                {/* Avatar */}
                {userId ? (
                    <Link
                        href={`/wall/${userId}`}
                        title="Ver muro"
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-6 h-6 mt-[2px] rounded-full overflow-hidden bg-neutral-800 border border-neutral-700">
                            {imageUrl ? (
                                <Image src={imageUrl} alt={name} fill sizes="24px" className="object-cover" />
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
                        className="relative w-6 h-6 mt-[2px] rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0"
                    >
                        {imageUrl ? (
                            <Image src={imageUrl} alt={name} fill sizes="24px" className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                                {name.slice(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                )}

                {/* Nombre + texto + reacciones */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-[14px] leading-5 flex flex-col">
                                {userId ? (
                                    <Link
                                        href={`/wall/${userId}`}
                                        title="Ver muro"
                                        className="text-gray-200 font-medium text-[10px]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {name}:
                                    </Link>
                                ) : (
                                    <span className="text-gray-200 font-medium text-[10px]">{name}</span>
                                )}

                                {response.__optimistic && (
                                    <span className="text-[11px] text-gray-400"> · Enviando…</span>
                                )}

                                <span className="text-gray-200 font-normal whitespace-pre-wrap break-words">
                                    {response.response}
                                </span>
                            </div>

                            {/* barra reacciones */}
                            <div className="mt-1 flex flex-row items-center gap-2 text-[10px]">
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
                                    <span>{likesCount}</span>
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
                                    <span>{unlikesCount}</span>
                                </button>
                            </div>
                        </div>

                        {/* ⋯ acciones response */}
                        {(canDelete || canReport) && (
                            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
                                            onClick={() => softDeleteResponse(response.id)}
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
                                                        onSelect={(e) => {
                                                            e.preventDefault(); // ✅ Radix
                                                            setMenuOpen(false); // ✅ cerrar menú
                                                            // abrir modal en el próximo tick (evita layer zombie)
                                                            setTimeout(() => onOpenReport(response.id, r.value), 0);
                                                        }}
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
                </div>
            </div>
        </div>
    );
}


// (lo dejabas abajo, no lo uso por ahora)
const scrollToBottom = () => {
    /*
    if (!autoScrollOnNew) return;
    setTimeout(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, 30);
    */
};
