import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import FollowButton from "./followButton"
import FriendButton from "./friendButton"
import PostCardMenubar from "./postCardMenubar"

interface ButtonFriendshipParams {
    text: string | null
    actionYes?: number | null,
    textYes?: string | null,
    actionNo?: number,
    textNo?: string
}

const UserProfileMiniCard = ({
    session,
    userId,
    userName,
    profileImageUrl,
    isFollower,
    isFriend,
    following,

}: {
    session: any,
    userId: number,
    userName: string,
    profileImageUrl: string,
    isFollower?: boolean,
    isFriend?: boolean,
    following: boolean
}) => {
    const [buttonFriendshipParamsState, setButtonFriendshipParams] = useState<ButtonFriendshipParams>()
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [requestPopup, setRequestPopup] = useState(false)
    const [requestPopupMenu, setRequestPopupMenu] = useState(false)
    const [requestPopupMenuDelete, setRequestPopupMenuDelete] = useState(false)

    const [isFollowerState, setIsFollowerState] = useState(isFollower)
    const [isFriendState, setIsFriendState] = useState(isFriend)
    const [followingState, setFollowingState] = useState(following)

    const onClickHandleFollowing = async () => {
        setFollowingState((prev) => !prev);
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
                setFollowingState(following); // opcional: rollback
            }
        } catch (error) {
            console.error("Error de red:", error);
            setFollowingState(following); // opcional: rollback
        }
    };

    const buttonParamsFunction = (relation: number): ButtonFriendshipParams => {
        if (relation === 0 || relation === 1 || relation === 4 || relation === 5 || relation === 6 || relation === 7) {
            return { text: "Enviar solicitud de amistad", actionYes: 2 }
        } else if (relation === 3) {
            return { text: "Quiere ser tu amigo", actionYes: 8, textYes: "aceptar", actionNo: 4, textNo: "rechazar" }
        } else if (relation === 8) {
            return { text: "Son amigos", actionYes: 6, textYes: "sí", actionNo: 0, textNo: "No, no quiero eliminar esta amistad" }
        } else if (relation === 2) {
            return { text: "Le has enviado solicitud de amistad", actionYes: 1, textYes: "sí", actionNo: 0, textNo: "No, no quiero cancelar la solicitud de amistad enviada" }
        }
        return { text: "" }
    }

    useEffect(() => {
        let isMounted = true; // Para evitar memory leaks en caso de desmontaje
        setLoading(true);

        async function fetchData() {
            try {
                const response = await fetch("/api/friendship", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, subject: "get" }),
                });
                if (!response.ok) throw new Error("Error en la petición");
                const result = await response.json();
                if (isMounted) setData(result);
                if (isMounted) setButtonFriendshipParams(buttonParamsFunction(result.relState))
            } catch (err) {
                if (isMounted && err instanceof Error) setError(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchData();
        return () => {
            isMounted = false; // Cleanup para evitar actualizaciones en componentes desmontados
        };
    }, []); // Solo se ejecuta una vez al montar el componente


    const onClickHandleFriendship = async (subject: string) => {
        //setIsFriendState(!isFriendState);
        try {
            const response = await fetch("/api/friendship", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, subject }),
            });

            const result = await response.json();
            console.log("result en friendButton: ", result);
            if (response.ok) {
                //setIsFriendState(result.following);
                setButtonFriendshipParams(buttonParamsFunction(result.relState))
            } else {
                console.error("Error en la API:", result.error);
            }
        } catch (error) {
            console.error("Error de red:", error);
        }
        setRequestPopup(false)
    };

    const switchRequestPopup = () => {
        setRequestPopup(requestPopup ? false : true)
    }

    const onClickHandleFriendshipMenu = async (subject: string) => {
        //setIsFriendState(!isFriendState);
        try {
            const response = await fetch("/api/friendship", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, subject }),
            });

            const result = await response.json();
            console.log("result en friendButton: ", result);
            if (response.ok) {
                //setIsFriendState(result.following);
                setButtonFriendshipParams(buttonParamsFunction(result.relState))
            } else {
                console.error("Error en la API:", result.error);
            }
        } catch (error) {
            console.error("Error de red:", error);
        }
        setRequestPopupMenu(false)
    };
    const switchRequestPopupMenu = () => {
        setRequestPopupMenu(requestPopupMenu ? false : true)
    }
    const switchRequestPopupMenuDelete = () => {
        setRequestPopupMenuDelete(requestPopupMenuDelete ? false : true)
    }


    return (
        <div className="userProfileMiniCard">
            <span className="text-[14px] font-bold m-0">{userName}</span>
            <div className="friendshipButtonImageAndButtons">
                <Link href={`/wall?user=${userId}`}>
                    <div className="flex flex-col items-center">
                        <span className="absolute text-red-500 font-black">{userId}</span>{/*QUITAR*/}
                        <Image src={profileImageUrl} alt="imagen de perfil" width={24} height={24} className="rounded-full w-auto h-auto m-0"></Image>
                    </div>
                </Link>
                {session && session.user.id != userId && (
                    <div className="userProfMCardButAndMenuContainer">
                        <div className="userProfileMiniCardButtonsContainer">
                            <FriendButton
                                userId={userId}
                                buttonParams={buttonFriendshipParamsState}
                                switchRequestPopup={switchRequestPopup}
                                onClickHandle={onClickHandleFriendship}
                                requestPopup={requestPopup}
                            />
                            {isFollowerState && <span id="isFollowingYou" className="userProfileMiniCardButton">Te sigue</span>}

                        </div>
                        <div className="userProfileMiniCardPostCardMenubarContainer">
                            <FollowButton userId={userId} following={followingState} onclick={onClickHandleFollowing}></FollowButton>
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
    )
}

export default UserProfileMiniCard