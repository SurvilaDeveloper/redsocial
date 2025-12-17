//postCardCommentsContainer.tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const PostCardCommentsContainer = ({
    disabled = false,
    onClickExpand,
    showFullDesc,
    shownDesc,
    isLogged,
    sessionUserId,
    commentId,
    commentUser,
    onCreated,
}: {
    disabled?: boolean;
    onClickExpand: () => void;
    showFullDesc: boolean;
    shownDesc: string;

    isLogged: boolean;
    sessionUserId: number | null;
    commentId: number;

    commentUser?: MiniUser | null;
    onCreated?: () => void;
}) => {
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const canSubmit =
        !disabled && isLogged && sessionUserId != null && reply.trim().length > 0 && !loading;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
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
                throw new Error(data?.error || "No se pudo guardar la respuesta");
            }

            setReply("");
            setMsg("Respuesta guardada ✅");
            onCreated?.();
        } catch (err: any) {
            setMsg(err?.message ?? "Error");
        } finally {
            setLoading(false);
        }
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
                        href={`/profile?user_id=${userId}`}
                        title="Ver perfil"
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

                <div className="min-w-0">
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
                            <span className="text-gray-200 font-medium">{name}</span>
                        )}

                        {disabled && <span className="text-[11px] text-gray-400"> · Enviando…</span>}

                        {/* ✅ SOLO el texto del comentario es clickeable y tiene title */}
                        <span
                            onClick={() => {
                                if (disabled) return;
                                onClickExpand();
                            }}
                            title={commentTitle}
                            className={[
                                "text-gray-200 font-normal whitespace-pre-wrap break-words",
                                disabled ? "cursor-not-allowed" : "cursor-pointer",
                            ].join(" ")}
                        >
                            {" "}
                            {shownDesc}
                        </span>
                    </div>
                </div>
            </div>

            {disabled && (
                <div className="mt-2 text-xs text-gray-400">
                    Esperando confirmación… (no se puede responder todavía)
                </div>
            )}

            {!disabled && showFullDesc && (
                <div className="mt-3">
                    {isLogged ? (
                        <form onSubmit={submit} className="space-y-2">
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                rows={3}
                                placeholder="Responder..."
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
                                    <span className={msg.includes("✅") ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
                                        {msg}
                                    </span>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className="text-sm text-gray-400">Iniciá sesión para responder.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostCardCommentsContainer;






