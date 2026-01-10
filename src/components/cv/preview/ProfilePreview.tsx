// src/components/cv/preview/ProfilePreview.tsx
"use client";

import React from "react";
import {
    Mail,
    Phone,
    Globe,
    Linkedin,
    Github,
    Facebook,
    Instagram,
    Youtube,
    X,
    MessageCircle,
    MapPin,
    User,
    Flag,
    Calendar,
} from "lucide-react";
import type { ProfileData } from "@/types/cv";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ProfilePreviewProps {
    data: ProfileData;
    className?: string;
    birthDate?: string | null;
}

export default function ProfilePreview({ data, className, birthDate }: ProfilePreviewProps) {
    const {
        address,
        postalCode,
        city,

        birthPlace,
        nationality,
        gender,

        showBirthDate,
        showAddress,
        showGender,

        email,
        phone,
        website,
        linkedin,
        github,
        facebook,
        instagram,
        youtube,
        x,
        discord,
        medium,
        devto,
    } = data;

    const locationText = buildLocation({ address, postalCode, city });

    const genderLabel =
        gender === "male"
            ? "Masculino"
            : gender === "female"
                ? "Femenino"
                : gender === "other"
                    ? "Otro"
                    : gender === "prefer_not_to_say"
                        ? "Prefiero no decir"
                        : "";

    const formatBirthDateAR = (s: string) => {
        const [y, m, d] = s.split("-");
        if (!y || !m || !d) return s;
        return `${d}/${m}/${y}`;
    };

    const isDiscordUrl = discord?.startsWith("http");

    const hasTopMeta =
        (showBirthDate && !!birthDate) ||
        (showAddress && !!locationText) ||
        !!nationality ||
        !!birthPlace ||
        (showGender && !!genderLabel);

    const hasContacts = !!(email || phone || website);
    const hasSocial =
        !!(linkedin || github || facebook || instagram || youtube || x || discord || medium || devto);

    if (!hasTopMeta && !hasContacts && !hasSocial) return null;

    return (
        <section className={cn("cv-block w-full border-b pb-4 mb-6", className)}>
            <div className="space-y-3">
                {hasTopMeta ? (
                    <div className="cv-row flex flex-wrap gap-x-4 gap-y-2">
                        {showBirthDate && birthDate ? (
                            <Meta
                                icon={Calendar}
                                value={`Nacimiento: ${formatBirthDateAR(birthDate)}`}
                                variant="date"
                            />
                        ) : null}

                        {showAddress && locationText ? (
                            <Meta icon={MapPin} value={locationText} />
                        ) : null}

                        {nationality ? <Meta icon={Flag} value={nationality} /> : null}
                        {birthPlace ? <Meta icon={User} value={`Nac.: ${birthPlace}`} /> : null}
                        {showGender && genderLabel ? (
                            <Meta icon={User} value={genderLabel} />
                        ) : null}
                    </div>
                ) : null}

                {hasContacts ? (
                    <div className="cv-row flex flex-wrap gap-x-4 gap-y-2">
                        {email ? <Item icon={Mail} value={email} href={`mailto:${email}`} /> : null}
                        {phone ? <Item icon={Phone} value={phone} href={`tel:${phone}`} /> : null}
                        {website ? (
                            <Item
                                icon={Globe}
                                value={stripProtocol(website)}
                                href={normalizeUrl(website)}
                            />
                        ) : null}
                    </div>
                ) : null}

                {hasSocial ? (
                    <div className="cv-row flex flex-wrap gap-3">
                        {linkedin ? <Social icon={Linkedin} href={linkedin} title="LinkedIn" /> : null}
                        {github ? <Social icon={Github} href={github} title="GitHub" /> : null}
                        {facebook ? <Social icon={Facebook} href={facebook} title="Facebook" /> : null}
                        {instagram ? <Social icon={Instagram} href={instagram} title="Instagram" /> : null}
                        {youtube ? <Social icon={Youtube} href={youtube} title="YouTube" /> : null}
                        {x ? <Social icon={X} href={x} title="X" /> : null}

                        {discord ? (
                            isDiscordUrl ? (
                                <Social icon={MessageCircle} href={discord} title={discord} />
                            ) : (
                                <Item icon={MessageCircle} value={discord} />
                            )
                        ) : null}

                        {medium ? <Social label="Medium" href={medium} title="Medium" /> : null}
                        {devto ? <Social label="DEV" href={devto} title="DEV.to" /> : null}
                    </div>
                ) : null}
            </div>
        </section>
    );
}

function Meta({
    icon: Icon,
    value,
    variant,
}: {
    icon: LucideIcon;
    value: string;
    variant?: "date";
}) {
    return (
        <div className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4 cv-icon" />
            <span className={variant === "date" ? "cv-date" : "cv-item-subtitle"}>
                {value}
            </span>
        </div>
    );
}

function Item({
    icon: Icon,
    value,
    href,
}: {
    icon: LucideIcon;
    value: string;
    href?: string;
}) {
    return (
        <a
            href={href}
            className="inline-flex items-center gap-2 hover:underline"
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noreferrer" : undefined}
        >
            <Icon className="h-4 w-4 cv-icon" />
            <span className="cv-text">{value}</span>
        </a>
    );
}

function Social({
    icon: Icon,
    href,
    label,
    title,
}: {
    icon?: LucideIcon;
    href: string;
    label?: string;
    title?: string;
}) {
    const content = Icon ? <Icon className="h-4 w-4" /> : <span className="cv-text">{label}</span>;

    return (
        <a
            href={normalizeUrl(href)}
            title={title || label}
            target="_blank"
            rel="noreferrer"
            className="cv-social"
        >
            {content}
        </a>
    );
}

function buildLocation(opts: { address?: string; postalCode?: string; city?: string }) {
    const { address, postalCode, city } = opts;
    const line1 = [address].filter(Boolean).join("");
    const line2 = [postalCode, city].filter(Boolean).join(" ");
    const out = [line1, line2].filter(Boolean).join(", ");
    return out.trim() || "";
}

function normalizeUrl(url: string) {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
}

function stripProtocol(url?: string) {
    if (!url) return "";
    return url.replace(/^https?:\/\//, "");
}
