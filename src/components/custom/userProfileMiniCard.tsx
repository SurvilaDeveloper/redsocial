// src/components/custom/userProfileMiniCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import FollowButton from "./followButton";
import FriendButton from "./friendButton";
import PostCardMenubar from "./postCardMenubar";

import { ButtonFriendshipParams } from "@/types/friendship";

const buttonParamsFromRelState = (relation: number): ButtonFriendshipParams => {
    if ([0, 1, 4, 5, 6, 7].includes(relation)) {
        return { text: "Enviar solicitud de amistad", actionYes: 2 };
    } else if (relation === 3) {
        return {
            text: "Quiere ser tu amigo",
            actionYes: 8,
            textYes: "aceptar",
            actionNo: 4,
            textNo: "rechazar",
        };
    } else if (relation === 8) {
        return {
            text: "Son amigos",
            actionYes: 6,
            textYes: "sí",
            actionNo: 0,
            textNo: "No, no quiero eliminar esta amistad",
        };
    } else if (relation === 2) {
        return {
            text: "Le has enviado solicitud de amistad",
            actionYes: 1,
            textYes: "sí",
            actionNo: 0,
            textNo: "No, no quiero cancelar la solicitud de amistad enviada",
        };
    }
    return { text: "" };
};

const UserProfileMiniCard = ({
    session,
    userId,
    userName,
    profileImageUrl,
    isFollower = false,
    isFriend = false,
    following,
}: {
    session: any;
    userId: number;
    userName: string;
    profileImageUrl: string | null;
    isFollower?: boolean;
    isFriend?: boolean;
    following: boolean;
}) => {
    // 🔹 Estado local basado en lo que YA viene del backend (relations)
    const [isFollowerState] = useState<boolean>(Boolean(isFollower));
    const [isFriendState, setIsFriendState] = useState<boolean>(Boolean(isFriend));
    const [followingState, setFollowingState] = useState<boolean>(Boolean(following));

    // 🔹 Estado para el botón de amistad (texto + acciones)
    const [buttonFriendshipParamsState, setButtonFriendshipParams] =
        useState<ButtonFriendshipParams>(() => {
            if (isFriend) {
                // estado "son amigos" (approx relState = 8)
                return buttonParamsFromRelState(8);
            }
            // estado por defecto: todavía no son amigos
            return buttonParamsFromRelState(1);
        });

    const [requestPopup, setRequestPopup] = useState(false);
    const [requestPopupMenu, setRequestPopupMenu] = useState(false);
    const [requestPopupMenuDelete, setRequestPopupMenuDelete] = useState(false);

    // ✅ Seguimiento
    const onClickHandleFollowing = async () => {
        const prev = followingState;
        setFollowingState((p) => !p);
        try {
            const response = await fetch("/api/follow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followingId: userId }),
            });
            const data = await response.json();
            if (response.ok) {
                setFollowingState(Boolean(data.following));
            } else {
                console.error("Error en la API:", data.error);
                setFollowingState(prev); // rollback
            }
        } catch (error) {
            console.error("Error de red:", error);
            setFollowingState(prev); // rollback
        }
    };

    // ✅ Amistad
    const onClickHandleFriendship = async (subject: string) => {
        try {
            const response = await fetch("/api/friendship", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, subject }),
            });

            const result = await response.json();
            console.log("result en friendButton: ", result);
            if (response.ok) {
                if (typeof result.relState === "number") {
                    setButtonFriendshipParams(
                        buttonParamsFromRelState(result.relState)
                    );
                    setIsFriendState(result.relState === 8);
                }
            } else {
                console.error("Error en la API:", result.error);
            }
        } catch (error) {
            console.error("Error de red:", error);
        }
        setRequestPopup(false);
    };

    const switchRequestPopup = () => {
        setRequestPopup((v) => !v);
    };

    const onClickHandleFriendshipMenu = async (subject: string) => {
        try {
            const response = await fetch("/api/friendship", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, subject }),
            });

            const result = await response.json();
            console.log("result en friendButton (menu): ", result);
            if (response.ok) {
                if (typeof result.relState === "number") {
                    setButtonFriendshipParams(
                        buttonParamsFromRelState(result.relState)
                    );
                    setIsFriendState(result.relState === 8);
                }
            } else {
                console.error("Error en la API:", result.error);
            }
        } catch (error) {
            console.error("Error de red:", error);
        }
        setRequestPopupMenu(false);
    };

    const switchRequestPopupMenu = () => {
        setRequestPopupMenu((v) => !v);
    };

    const switchRequestPopupMenuDelete = () => {
        setRequestPopupMenuDelete((v) => !v);
    };

    return (
        <div className="flex flex-col w-full gap-1 text-slate-100">
            {/* Nombre */}
            <span className="text-[14px] font-bold leading-tight">
                {userName}
            </span>

            {/* Avatar + botones */}
            <div className="flex flex-row items-center w-full gap-2">
                <Link href={`/wall?user=${userId}`}>
                    <div className="w-8 h-8 relative overflow-hidden rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center">
                        {profileImageUrl ? (
                            <Image
                                src={profileImageUrl}
                                alt="imagen de perfil"
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-[10px] text-slate-300">
                                {userName[0]?.toUpperCase() ?? "?"}
                            </span>
                        )}
                    </div>
                </Link>

                {session && session.user.id != userId && (
                    <div className="flex flex-1 flex-col gap-1 ml-1">
                        {/* Fila: botón de amistad + badge "Te sigue" */}
                        <div className="flex flex-row flex-wrap items-center gap-1">
                            <FriendButton
                                userId={userId}
                                buttonParams={buttonFriendshipParamsState}
                                switchRequestPopup={switchRequestPopup}
                                onClickHandle={onClickHandleFriendship}
                                requestPopup={requestPopup}
                            />

                            {isFollowerState && (
                                <span
                                    id="isFollowingYou"
                                    className="userProfileMiniCardButton"
                                >
                                    Te sigue
                                </span>
                            )}
                        </div>

                        {/* Fila: seguir / menú (alineado a la derecha) */}
                        <div className="flex flex-row items-center justify-end gap-1">
                            <FollowButton
                                userId={userId}
                                following={followingState}
                                onclick={onClickHandleFollowing}
                            />
                            <PostCardMenubar
                                following={followingState}
                                followingId={userId}
                                onclickfollowing={onClickHandleFollowing}
                                buttonFriendshipParams={buttonFriendshipParamsState}
                                switchRequestPopup={switchRequestPopupMenu}
                                onclickfriendship={onClickHandleFriendshipMenu}
                                requestPopup={requestPopupMenu}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileMiniCard;

