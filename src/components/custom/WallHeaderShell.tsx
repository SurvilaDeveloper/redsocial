// src/components/custom/WallHeaderShell.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ChevronDown,
    ChevronUp,
    Globe,
    MapPin,
    Briefcase,
    Github,
    Linkedin,
    Instagram,
    Facebook,
    X as XIcon,
    Loader2,
    Image as ImageIcon,
} from "lucide-react";

type Mode = "live" | "preview";

type WallHeaderUser = {
    id?: number;
    name?: string | null;
    nick?: string | null;

    imageUrl?: string | null;
    imageWallUrl?: string | null;
    image?: string | null;

    wallHeaderBackgroundType?: "image" | "color" | null;
    wallHeaderBackgroundColor?: string | null;

    occupation?: string | null;
    company?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;

    website?: string | null;
    bio?: string | null;

    twitterHandle?: string | null;
    facebookHandle?: string | null;
    instagramHandle?: string | null;
    linkedinHandle?: string | null;
    githubHandle?: string | null;

    meta?: {
        cv?: { canView?: boolean };
    };
};

function hexToRgb(hex: string) {
    const value = hex.replace("#", "");
    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
    };
}

function isDarkColor(hex?: string | null) {
    if (!hex) return true;
    const { r, g, b } = hexToRgb(hex);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 140;
}

function safeWebsiteLabel(url: string) {
    try {
        const u = new URL(url);
        return u.host.replace(/^www\./, "");
    } catch {
        return url.replace(/^https?:\/\//, "").slice(0, 40);
    }
}

function normalizeUrlMaybe(url?: string | null) {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

function SocialLink({
    href,
    title,
    children,
}: {
    href: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={title}
            className={cn(
                "inline-flex items-center justify-center",
                "h-9 w-9 rounded-full",
                "border border-slate-700/70 bg-slate-950/40",
                "hover:bg-slate-900/70 hover:border-slate-600",
                "transition"
            )}
        >
            <span className="text-slate-200">{children}</span>
        </a>
    );
}

export function buildSocialHref(
    kind: "x" | "instagram" | "facebook" | "linkedin" | "github",
    raw?: string | null
) {
    if (!raw) return null;
    const t = raw.trim();
    if (!t) return null;

    if (/^https?:\/\//i.test(t)) return t;
    if (/^www\./i.test(t)) return `https://${t}`;

    const handle = t.replace(/^@+/, "");

    switch (kind) {
        case "x":
            return handle ? `https://x.com/${handle}` : null;
        case "instagram":
            return handle ? `https://instagram.com/${handle}` : null;
        case "facebook":
            return handle ? `https://facebook.com/${handle}` : null;
        case "linkedin":
            if (!handle) return null;
            return handle.startsWith("in/") || handle.startsWith("company/")
                ? `https://linkedin.com/${handle}`
                : `https://linkedin.com/in/${handle}`;
        case "github":
            return handle ? `https://github.com/${handle}` : null;
        default:
            return null;
    }
}

export type WallHeaderShellProps = {
    mode: Mode;

    // en live: expanded controla si renderiza fullUser vs basicUser.
    expanded: boolean;
    onToggleExpanded?: () => void;

    // en live: pasás basicUser o fullUser según expanded.
    displayUser: WallHeaderUser | null;

    // en live: fullUser para panel expandido.
    fullUser?: WallHeaderUser | null;

    enableToView?: EnableToView | null;

    // live: loader/error reales. preview: podés pasar false/null.
    loading?: boolean;
    error?: string | null;

    // CV
    canShowCvButton?: boolean; // live: expanded && fullUser.meta.cv.canView, preview: lo que quieras
    onOpenCv?: () => void;

    // opcional: si querés “lockear” el diseño exacto al wall
    userIdForCv?: number; // live lo usa tu modal afuera
};

export default function WallHeaderShell({
    mode,
    expanded,
    onToggleExpanded,
    displayUser,
    fullUser,
    enableToView,
    loading = false,
    error = null,
    canShowCvButton = false,
    onOpenCv,
}: WallHeaderShellProps) {
    if (!displayUser) return null;

    const enableToViewProfileImage = enableToView?.profileImage ?? true;
    const enableToViewCoverImage = enableToView?.coverImage ?? true;
    const enableToViewFullProfile = enableToView?.fullProfile ?? true;

    const profileImage = displayUser.imageUrl ?? displayUser.image ?? null;

    const bgMode = displayUser?.wallHeaderBackgroundType ?? null;

    const backgroundStyle = React.useMemo(() => {
        const base = "rgb(2,6,23)";

        if (!enableToViewCoverImage) {
            return {
                backgroundColor: base,
                backgroundImage: `
        radial-gradient(900px circle at 20% 20%, rgba(59,130,246,0.16), transparent 60%),
        radial-gradient(800px circle at 80% 30%, rgba(168,85,247,0.12), transparent 62%),
        linear-gradient(180deg, rgba(255,255,255,0.06), transparent 45%, rgba(0,0,0,0.35))
      `,
                backgroundBlendMode: "screen, screen, normal",
            } as React.CSSProperties;
        }

        if (bgMode === "image") {
            return displayUser?.imageWallUrl
                ? { backgroundImage: `url(${displayUser.imageWallUrl})` }
                : { backgroundColor: "rgb(2,6,23)" };
        }

        if (bgMode === "color") {
            return {
                backgroundColor: displayUser?.wallHeaderBackgroundColor ?? "rgb(2,6,23)",
            };
        }

        return { backgroundColor: "rgb(2,6,23)" };
    }, [
        bgMode,
        displayUser?.imageWallUrl,
        displayUser?.wallHeaderBackgroundColor,
        enableToViewCoverImage,
    ]);

    const isDarkBg = React.useMemo(() => {
        return bgMode === "color"
            ? isDarkColor(displayUser?.wallHeaderBackgroundColor)
            : true;
    }, [bgMode, displayUser?.wallHeaderBackgroundColor, displayUser]);

    const titleTextClass = isDarkBg ? "text-white" : "text-slate-900";
    const subTextClass = isDarkBg ? "text-slate-200" : "text-slate-700";
    const shadowClass = isDarkBg ? "drop-shadow" : "";

    const websiteHref = expanded ? normalizeUrlMaybe(fullUser?.website ?? null) : null;

    const xHref = expanded ? buildSocialHref("x", fullUser?.twitterHandle ?? null) : null;
    const fbHref = expanded ? buildSocialHref("facebook", fullUser?.facebookHandle ?? null) : null;
    const igHref = expanded ? buildSocialHref("instagram", fullUser?.instagramHandle ?? null) : null;
    const liHref = expanded ? buildSocialHref("linkedin", fullUser?.linkedinHandle ?? null) : null;
    const ghHref = expanded ? buildSocialHref("github", fullUser?.githubHandle ?? null) : null;

    return (
        <div>
            <header className="w-full border-b border-slate-800/80 mb-2">
                {/* Cover */}
                <div
                    className={cn(
                        "relative w-full",
                        "h-[220px] lg:h-[260px]",
                        "bg-cover bg-center bg-no-repeat"
                    )}
                    style={backgroundStyle as any}
                >
                    {/* overlays (se adaptan según el brillo del color) */}
                    {isDarkBg ? (
                        <>
                            <div className="absolute inset-0 bg-black/35" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-white/20" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/20 to-transparent" />
                        </>
                    )}

                    {/* content (TODO dentro del cover) */}
                    <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
                        {/* avatar */}
                        <div className="relative">
                            {profileImage && enableToViewProfileImage && (
                                <img
                                    src={profileImage}
                                    alt={displayUser.name ?? "Usuario"}
                                    className={cn(
                                        "w-24 h-24 lg:w-28 lg:h-28 rounded-full object-cover",
                                        "border border-slate-700/80 shadow-xl",
                                        "ring-4 ring-black/40"
                                    )}
                                />
                            )}
                        </div>
                        {/* name/nick dentro del cover */}
                        <div className="mt-3 space-y-0.5">
                            {displayUser.name && (
                                <h1
                                    className={cn(
                                        "text-xl lg:text-2xl font-semibold",
                                        titleTextClass,
                                        shadowClass
                                    )}
                                >
                                    {displayUser.name}
                                </h1>
                            )}
                            {displayUser.nick && (
                                <span className={cn("text-sm", subTextClass, shadowClass)}>
                                    @{displayUser.nick}
                                </span>
                            )}
                        </div>
                    </div>
                </div>


            </header>
            {/* Lower section */}
            {enableToViewFullProfile && (

                <div className="w-full bg-slate-950/20">
                    <div className="pt-1 flex flex-col items-center text-center gap-2">

                        {/* Actions */}

                        <div className="mt-0 flex flex-col sm:flex-row items-center gap-4">
                            {(canShowCvButton && expanded) ? (
                                <Button
                                    variant="secondary"
                                    onClick={onOpenCv}
                                    className={cn(
                                        "h-9",
                                        "bg-slate-900/60 border border-slate-700/70 text-slate-100",
                                        "hover:bg-slate-900 hover:border-slate-600"
                                    )}
                                >
                                    Ver CV
                                </Button>
                            ) : null}

                            <button
                                type="button"
                                onClick={onToggleExpanded}
                                className={cn(
                                    "inline-flex items-center justify-center gap-2",
                                    "h-9 px-3 rounded-md",
                                    "border border-slate-700/70",
                                    "bg-slate-900/30 hover:bg-slate-900/60",
                                    "text-sm text-slate-200",
                                    "transition"
                                )}
                            >
                                {expanded ? "Ver menos" : `Ver más`}
                                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>

                        {/* Loading/Error */}
                        <div className="mt-2">
                            {loading && mode === "live" && (
                                <p className="inline-flex items-center gap-2 text-xs text-slate-400">
                                    <Loader2 className="animate-spin" size={14} />
                                    Cargando...
                                </p>
                            )}
                            {error && mode === "live" && <p className="text-xs text-red-400">{error}</p>}
                        </div>

                        {/* Expanded details */}
                        {enableToViewFullProfile && expanded && fullUser && (
                            <Card
                                className={cn(
                                    "mt-0 w-full",
                                    "bg-slate-950/60 border-slate-800/80",
                                    "rounded-2xl p-4"
                                )}
                            >
                                <div className="space-y-3">
                                    {(fullUser.occupation || fullUser.company) && (
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-200">
                                            <Briefcase size={16} className="text-slate-400" />
                                            <span className="text-slate-200">
                                                {fullUser.occupation ? fullUser.occupation : "—"}
                                                {fullUser.company ? ` · ${fullUser.company}` : ""}
                                            </span>
                                        </div>
                                    )}

                                    {(fullUser.city || fullUser.province || fullUser.country) && (
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                                            <MapPin size={16} className="text-slate-400" />
                                            <span>
                                                {[fullUser.city, fullUser.province, fullUser.country]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </span>
                                        </div>
                                    )}

                                    {websiteHref && (
                                        <div className="flex items-center justify-center gap-2 text-sm">
                                            <Globe size={16} className="text-slate-400" />
                                            <a
                                                href={websiteHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sky-300 hover:underline"
                                            >
                                                {safeWebsiteLabel(websiteHref)}
                                            </a>
                                        </div>
                                    )}

                                    {fullUser.bio && (
                                        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
                                            {fullUser.bio}
                                        </p>
                                    )}

                                    {/* Socials */}
                                    <div className="pt-1 flex items-center justify-center gap-2 flex-wrap">
                                        {fullUser.twitterHandle && xHref && (
                                            <SocialLink href={xHref} title="X / Twitter">
                                                <XIcon size={16} />
                                            </SocialLink>
                                        )}
                                        {fullUser.facebookHandle && fbHref && (
                                            <SocialLink href={fbHref} title="Facebook">
                                                <Facebook size={16} />
                                            </SocialLink>
                                        )}
                                        {fullUser.instagramHandle && igHref && (
                                            <SocialLink href={igHref} title="Instagram">
                                                <Instagram size={16} />
                                            </SocialLink>
                                        )}
                                        {fullUser.linkedinHandle && liHref && (
                                            <SocialLink href={liHref} title="LinkedIn">
                                                <Linkedin size={16} />
                                            </SocialLink>
                                        )}
                                        {fullUser.githubHandle && ghHref && (
                                            <SocialLink href={ghHref} title="GitHub">
                                                <Github size={16} />
                                            </SocialLink>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
