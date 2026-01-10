// src/components/custom/WallHeader.tsx
"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { WallUserFull, WallUserBasic } from "@/types/wall";

function hexToRgb(hex: string) {
    const value = hex.replace("#", "");
    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
    };
}

function isDarkColor(hex?: string | null) {
    if (!hex) return true; // fallback oscuro
    const { r, g, b } = hexToRgb(hex);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 140;
}


interface WallHeaderProps {
    session: Session | null;
    userId: number;
}

const WallHeader = ({ session, userId }: WallHeaderProps) => {
    const [expanded, setExpanded] = useState(false);
    const [fullUser, setFullUser] = useState<WallUserFull | null>(null);
    const [basicUser, setBasicUser] = useState<WallUserBasic | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);




    // Fetch fullUser
    const fetchFullUser = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/wall/user/${userId}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();

            const normalizedUser: WallUserFull = {
                ...data.user,
                isOwner: data.meta?.isOwner ?? false,
                isFriend: data.meta?.isFriend ?? false,
                isFollower: data.meta?.isFollower ?? false,
                visibility: data.user.visibility ?? undefined,
            };

            setFullUser(normalizedUser);

            // Definir basicUser a partir de fullUser
            setBasicUser({
                id: normalizedUser.id,
                name: normalizedUser.name,
                nick: normalizedUser.nick,
                imageUrl: normalizedUser.imageUrl,
                imageWallUrl: normalizedUser.imageWallUrl,
                wallHeaderBackgroundColor: normalizedUser.wallHeaderBackgroundColor,
                wallHeaderBackgroundType: normalizedUser.wallHeaderBackgroundType
            });
        } catch (err: any) {
            setError(err.message || "Error al cargar la información");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFullUser();
    }, [userId]);

    const handleToggle = () => setExpanded((prev) => !prev);

    const displayBasic = !expanded;

    const displayUser = displayBasic ? basicUser : fullUser;

    const isDarkBg =
        displayUser?.wallHeaderBackgroundType === "color"
            ? isDarkColor(displayUser.wallHeaderBackgroundColor)
            : true;

    if (!displayUser) return null;

    return (
        <header className="w-full py-4 md:py-6 border-b border-slate-800 mb-2">
            {displayUser.wallHeaderBackgroundType == "image" && (
                <div
                    className="flex flex-col items-center justify-center gap-2 text-center
             bg-cover bg-center bg-no-repeat h-[200px]"
                    style={{
                        backgroundImage: displayUser?.imageWallUrl
                            ? `url(${displayUser.imageWallUrl})`
                            : undefined,
                        textShadow: "0 8px 6px rgba(0,0,0,1)",
                    }}
                >

                    {displayUser.imageUrl && (
                        <img
                            src={displayUser.imageUrl}
                            alt={displayUser.name ?? "Usuario"}
                            className="w-24 h-24 rounded-full object-cover border border-slate-700"
                        />
                    )}

                    {displayUser.name && <h1 className="text-xl md:text-2xl font-semibold">{displayUser.name}</h1>}
                    {displayUser.nick && <span className="text-sm text-slate-200">@{displayUser.nick}</span>}
                </div>
            )}
            {displayUser.wallHeaderBackgroundType == "color" && (
                <div
                    className="flex flex-col items-center justify-center gap-2 text-center
             bg-cover bg-center bg-no-repeat h-[200px]"
                    style={{
                        backgroundColor: displayUser?.wallHeaderBackgroundColor ? displayUser?.wallHeaderBackgroundColor : "rgb(2,6,23)",
                        textShadow: "0 6px 10px rgba(0,0,0,1)",
                    }}
                >

                    {displayUser.imageUrl && (
                        <img
                            src={displayUser.imageUrl}
                            alt={displayUser.name ?? "Usuario"}
                            className="w-24 h-24 rounded-full object-cover border border-slate-700"
                        />
                    )}

                    {displayUser.name && <h1
                        className={`text-xl md:text-2xl font-semibold ${isDarkBg ? "text-white" : "text-slate-900"
                            }`}
                    >
                        {displayUser.name}
                    </h1>
                    }
                    {displayUser.nick && <span
                        className={`text-sm ${isDarkBg ? "text-slate-200" : "text-slate-700"
                            }`}
                    >
                        @{displayUser.nick}
                    </span>
                    }
                </div>
            )}
            {!displayUser.wallHeaderBackgroundType && (
                <div
                    className="flex flex-col items-center justify-center gap-2 text-center
             bg-cover bg-center bg-no-repeat h-[200px]"
                    style={{
                        backgroundColor: "rgb(2,6,23)",
                        textShadow: "0 8px 6px rgba(0,0,0,1)",
                    }}
                >

                    {displayUser.imageUrl && (
                        <img
                            src={displayUser.imageUrl}
                            alt={displayUser.name ?? "Usuario"}
                            className="w-24 h-24 rounded-full object-cover border border-slate-700"
                        />
                    )}

                    {displayUser.name && <h1 className="text-xl md:text-2xl font-semibold">{displayUser.name}</h1>}
                    {displayUser.nick && <span className="text-sm text-slate-200">@{displayUser.nick}</span>}
                </div>
            )}

            <div className="flex flex-col items-center gap-2 text-center">

                {expanded && fullUser && (fullUser.occupation || fullUser.company) && (
                    <div className="text-sm text-slate-300">
                        {fullUser.occupation && <span>{fullUser.occupation}</span>}
                        {fullUser.company && <span> · Trabaja en {fullUser.company}</span>}
                    </div>
                )}

                {expanded && fullUser && (fullUser.city || fullUser.province || fullUser.country) && (
                    <div className="text-sm text-slate-300">
                        {[fullUser.city, fullUser.province, fullUser.country].filter(Boolean).join(" · ")}
                    </div>
                )}

                {expanded && fullUser?.website && (
                    <a
                        href={fullUser.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:underline"
                    >
                        {fullUser.website.replace(/^https?:\/\//, "")}
                    </a>
                )}

                {expanded && fullUser?.bio && (
                    <p className="mt-2 text-sm text-slate-300 max-w-xl px-4">{fullUser.bio}</p>
                )}

                {expanded && (
                    <div className="flex gap-2 mt-1">
                        {fullUser?.twitterHandle && <span>🐦 @{fullUser.twitterHandle}</span>}
                        {fullUser?.facebookHandle && <span>📘 {fullUser.facebookHandle}</span>}
                        {fullUser?.instagramHandle && <span>📸 {fullUser.instagramHandle}</span>}
                        {fullUser?.linkedinHandle && <span>🔗 {fullUser.linkedinHandle}</span>}
                        {fullUser?.githubHandle && <span>💻 {fullUser.githubHandle}</span>}
                    </div>
                )}

                <button onClick={handleToggle} className="mt-3 px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                    {expanded ? "Ver menos información" : `Ver más información de ${displayUser.name ?? "el usuario"}`}
                </button>

                {loading && <p className="text-sm text-slate-400 mt-1">Cargando...</p>}
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
        </header>
    );
};

export default WallHeader;










