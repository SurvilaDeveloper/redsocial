// src/components/custom/WallHeader.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Session } from "next-auth";
import type { WallUserFull, WallUserBasic } from "@/types/wall";
import { CVPreviewModal } from "../cv/CVPreviewModal";
import WallHeaderShell from "./WallHeaderShell";

interface WallHeaderProps {
    userId: number;
    enableToView: EnableToView | null;
}

const WallHeader = ({ userId, enableToView }: WallHeaderProps) => {
    const [expanded, setExpanded] = useState(false);
    const [fullUser, setFullUser] = useState<WallUserFull | null>(null);
    const [basicUser, setBasicUser] = useState<WallUserBasic | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openCv, setOpenCv] = useState(false);

    const fetchFullUser = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/wall/user/${userId}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();

            //console.log('data en wallHeader: ', data);

            const normalizedUser: WallUserFull = {
                ...data.user,
                meta: {
                    isOwner: Boolean(data?.meta?.isOwner ?? false),
                    isFriend: Boolean(data?.meta?.isFriend ?? false),
                    isFollower: Boolean(data?.meta?.isFollower ?? false),
                    visibility: data?.meta?.visibility ?? data?.user?.visibility ?? undefined,
                    cv: data?.meta?.cv,
                },
            };

            setFullUser(normalizedUser);

            //console.log('normalizedUser en wallHeader: ', normalizedUser);

            setBasicUser({
                id: normalizedUser.id,
                name: normalizedUser.name,
                nick: normalizedUser.nick,
                imageUrl: normalizedUser.imageUrl,
                imageWallUrl: normalizedUser.imageWallUrl,
                image: normalizedUser.image,
                wallHeaderBackgroundColor: normalizedUser.wallHeaderBackgroundColor,
                wallHeaderBackgroundType: normalizedUser.wallHeaderBackgroundType,
            });
            //console.log('basicUser en wallHeader:', basicUser);
        } catch (err: any) {
            setError(err?.message || "Error al cargar la información");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchFullUser();
    }, [fetchFullUser]);

    const displayUser = expanded ? fullUser : basicUser;

    const canShowCvButton = expanded && fullUser?.meta?.cv?.canView === true;

    useEffect(() => {
        if (!canShowCvButton) setOpenCv(false);
    }, [canShowCvButton]);

    const handleToggleExpanded = useCallback(() => {
        setExpanded((prev) => {
            const next = !prev;
            if (!next) setOpenCv(false);
            return next;
        });
    }, []);

    if (!displayUser) return null;

    return (
        <>
            <WallHeaderShell
                mode="live"
                expanded={expanded}
                onToggleExpanded={handleToggleExpanded}
                displayUser={displayUser as any}
                fullUser={fullUser as any}
                enableToView={enableToView as any}
                loading={loading}
                error={error}
                canShowCvButton={canShowCvButton}
                onOpenCv={() => setOpenCv(true)}
            />

            {openCv && (
                <CVPreviewModal userId={userId} onClose={() => setOpenCv(false)} />
            )}
        </>
    );
};

export default WallHeader;


