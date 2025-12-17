"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";


type MiniUser = {
    id: number;
    name: string;
    imageUrl: string | null;
    imagePublicId?: string | null;
};

type PostCommentResponse = {
    id: number;
    response: string;
    createdAt: string;
    who_responses: number;
    active?: number | null;
    user?: MiniUser;
};

type Props = {
    commentId: number;
    responses?: PostCommentResponse[];

    isLogged: boolean;
    sessionUserId: number | null;
    sessionUserName?: string | null;
    sessionUserImageUrl?: string | null;

    disabled?: boolean;
    onCreated?: () => void;

    defaultExpanded?: boolean;

    // ✅ ajustes
    autoExpandOnNew?: boolean;
    autoScrollOnNew?: boolean;
};

type LocalResponse = PostCommentResponse & {
    __optimistic?: boolean;
};

function pluralRespuestas(n: number) {
    return n === 1 ? "1 respuesta" : `${n} respuestas`;
}

export default function PostCardCommetsResponsesContainer({
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
}: Props) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    // Estado local para optimistic + no depender de refresh
    const [localResponses, setLocalResponses] = useState<LocalResponse[]>(responses);

    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement | null>(null);

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

    const buttonLabel = expanded
        ? "Ocultar respuestas"
        : `Ver ${pluralRespuestas(count)}`;

    const canSubmit =
        !disabled && isLogged && sessionUserId != null && reply.trim().length > 0 && !loading;

    const scrollToBottom = () => {
        if (!autoScrollOnNew) return;
        // pequeño timeout para que el DOM pinte el nuevo item
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 30);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || sessionUserId == null) return;

        const content = reply.trim();
        setReply("");
        setMsg(null);

        if (autoExpandOnNew && !expanded) setExpanded(true);

        const tempId = -Date.now();

        const optimistic: LocalResponse = {
            id: tempId,
            response: content,
            createdAt: new Date().toISOString(),
            who_responses: sessionUserId,
            active: 1,
            user: {
                id: sessionUserId,
                name: sessionUserName ?? "Tú",
                imageUrl: sessionUserImageUrl ?? null,
            },
            __optimistic: true,
        };

        setLocalResponses((prev) => [...prev, optimistic]);
        scrollToBottom();

        setLoading(true);

        try {
            const res = await fetch("/api/post-comment-responses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    post_comment_id: commentId,
                    response: content,
                }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "No se pudo guardar la respuesta");

            const created = data?.data; // { id, createdAt, response, who_responses, post_comment_id }

            setLocalResponses((prev) =>
                prev.map((r) =>
                    r.id === tempId
                        ? {
                            ...r,
                            id: created.id,
                            createdAt: created.createdAt,
                            __optimistic: false,
                        }
                        : r
                )
            );

            setMsg("Respuesta guardada ✅");
            onCreated?.();
            scrollToBottom();
        } catch (err: any) {
            setLocalResponses((prev) => prev.filter((r) => r.id !== tempId));
            setMsg(err?.message ?? "Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-2 ml-3 border-l border-neutral-700 pl-3">
            {/* Toggle */}
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-gray-300 hover:text-gray-200 select-none"
            >
                {buttonLabel}
            </button>

            {expanded && (
                <div className="mt-2 flex flex-col gap-2">
                    {/* Lista */}
                    {count === 0 ? (
                        <div className="text-xs text-gray-500">Sin respuestas todavía.</div>
                    ) : (
                        activeSorted.map((r) => {
                            const userId = r.user?.id ?? null;
                            const name = r.user?.name ?? "Usuario";
                            const imageUrl = r.user?.imageUrl ?? null;

                            return (
                                <div key={r.id} className="text-sm text-gray-300">
                                    <div className="flex items-start gap-2 w-full">
                                        {/* Avatar */}
                                        {userId ? (
                                            <Link
                                                href={`/profile?user_id=${userId}`}
                                                title="Ver perfil"
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

                                        {/* Nombre + texto en línea */}
                                        <div className="min-w-0">
                                            <div className="text-xs leading-5">
                                                {userId ? (
                                                    <Link
                                                        href={`/profile?user_id=${userId}`}
                                                        title="Ver perfil"
                                                        className="text-gray-200 font-medium hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {name}: &rarr;
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-200 font-medium">{name}</span>
                                                )}

                                                {r.__optimistic && (
                                                    <span className="text-[11px] text-gray-400"> · Enviando…</span>
                                                )}

                                                <span className="text-gray-200 font-normal whitespace-pre-wrap break-words">
                                                    {" "}
                                                    {r.response}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );


                        })
                    )}

                    {/* ancla para scroll */}
                    <div ref={bottomRef} />

                    {/* Form */}
                    {disabled ? (
                        <div className="text-xs text-gray-400 mt-2">
                            Esperando confirmación del comentario… (no se puede responder todavía)
                        </div>
                    ) : isLogged ? (
                        <form onSubmit={submit} className="mt-2 space-y-2">
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                rows={2}
                                placeholder="Escribí una respuesta..."
                                className="w-full rounded-md bg-neutral-900 text-gray-100 border border-neutral-700 p-2 outline-none focus:border-neutral-500"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="px-3 py-1.5 rounded-md bg-neutral-800 text-gray-100 border border-neutral-700 disabled:opacity-50"
                                >
                                    {loading ? "Guardando..." : "Responder"}
                                </button>

                                {msg && (
                                    <span
                                        className={msg.includes("✅") ? "text-green-400 text-sm" : "text-red-400 text-sm"}
                                    >
                                        {msg}
                                    </span>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className="text-xs text-gray-400 mt-2">Iniciá sesión para responder.</div>
                    )}
                </div>
            )}
        </div>
    );
}

