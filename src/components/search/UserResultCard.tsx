// src/components/search/UserResultCard.tsx
"use client";

import Link from "next/link";
import { useTransition } from "react";
import { SearchUserRow } from "./types";
import { Highlight } from "./highlight";

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[11px] px-2 py-1 rounded-full border border-slate-800 bg-slate-900 text-slate-200">
            {children}
        </span>
    );
}

export default function UserResultCard({
    user,
    query,
    onPatch,
}: {
    user: SearchUserRow;
    query: string;
    onPatch: (patch: Partial<SearchUserRow>) => void;
}) {
    const [pending, startTransition] = useTransition();

    async function toggleFollow() {
        const next = !user.isFollowing;
        onPatch({ isFollowing: next });

        startTransition(async () => {
            const res = await fetch("/api/social/follow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: user.id, action: next ? "follow" : "unfollow" }),
            });
            if (!res.ok) onPatch({ isFollowing: !next });
        });
    }

    async function friendAction(action: "send" | "cancel" | "accept" | "reject" | "unfriend") {
        const prev = user.friendStatus;

        const optimistic =
            action === "send" ? "sent" :
                action === "cancel" ? "none" :
                    action === "accept" ? "friends" :
                        action === "reject" ? "none" :
                            action === "unfriend" ? "none" :
                                prev;

        onPatch({ friendStatus: optimistic });

        startTransition(async () => {
            const res = await fetch("/api/social/friend-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: user.id, action }),
            });
            if (!res.ok) onPatch({ friendStatus: prev });
        });
    }

    const subline = [user.occupation, user.company ? `@ ${user.company}` : null, user.city || user.location || null]
        .filter(Boolean)
        .join(" ");

    const showCounts =
        user.followersCount != null || user.followingCount != null || user.friendsCount != null;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 flex gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-slate-500 text-xs">IMG</span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="text-slate-100 font-medium truncate">
                            <Highlight text={user.name} query={query} />{" "}
                            {user.nick ? (
                                <span className="text-slate-400 font-normal">
                                    @<Highlight text={user.nick} query={query} />
                                </span>
                            ) : null}
                        </div>

                        {subline ? (
                            <div className="text-xs text-slate-400 mt-0.5 truncate">
                                <Highlight text={subline} query={query} />
                            </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2 mt-2">
                            {user.isFollowing ? <Badge>Siguiendo</Badge> : null}
                            {user.isFollower ? <Badge>Te sigue</Badge> : null}

                            {user.friendStatus === "friends" ? <Badge>Amigos</Badge> : null}
                            {user.friendStatus === "sent" ? <Badge>Solicitud enviada</Badge> : null}
                            {user.friendStatus === "received" ? <Badge>Te envió solicitud</Badge> : null}

                            {user.hasPublicCV ? <Badge>CV público</Badge> : null}

                            {showCounts ? (
                                <Badge>
                                    {user.followersCount ?? 0} seguidores · {user.followingCount ?? 0} siguiendo ·{" "}
                                    {user.friendsCount ?? 0} amigos
                                </Badge>
                            ) : null}
                        </div>


                        {user.mutualFriend ? (
                            <div className="text-xs text-slate-500 mt-2">
                                Es amigo de{" "}
                                <Link className="text-slate-300 hover:underline" href={`/wall/${user.mutualFriend.id}`}>
                                    {user.mutualFriend.name}
                                </Link>
                                {user.mutualFriend.nick ? ` (@${user.mutualFriend.nick})` : null}
                            </div>
                        ) : null}

                        {user.hasPublicCV && (user.cvTitle || user.cvSummary) ? (
                            <div className="text-xs text-slate-400 mt-2">
                                <span className="text-slate-300">CV:</span>{" "}
                                {user.cvTitle ? <Highlight text={user.cvTitle} query={query} /> : null}
                                {user.cvSummary ? (
                                    <span className="text-slate-400">
                                        {" "}
                                        — <Highlight text={user.cvSummary} query={query} />
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <Link
                            href={`/wall/${user.id}`}
                            className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800"
                        >
                            Visitar
                        </Link>

                        <button
                            disabled={pending}
                            onClick={toggleFollow}
                            className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                            title={user.isFollowing ? "Dejar de seguir" : "Seguir"}
                        >
                            {user.isFollowing ? "Siguiendo" : "Seguir"}
                        </button>

                        {/* Amistad: botones inline según estado */}
                        {user.friendStatus === "none" ? (
                            <button
                                disabled={pending}
                                onClick={() => friendAction("send")}
                                className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                            >
                                Agregar
                            </button>
                        ) : null}

                        {user.friendStatus === "sent" ? (
                            <button
                                disabled={pending}
                                onClick={() => friendAction("cancel")}
                                className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                            >
                                Cancelar
                            </button>
                        ) : null}

                        {user.friendStatus === "received" ? (
                            <div className="flex gap-2">
                                <button
                                    disabled={pending}
                                    onClick={() => friendAction("accept")}
                                    className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                                >
                                    Aceptar
                                </button>
                                <button
                                    disabled={pending}
                                    onClick={() => friendAction("reject")}
                                    className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                                >
                                    Rechazar
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

