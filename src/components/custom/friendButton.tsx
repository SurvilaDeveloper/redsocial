// src/components/friendButton.tsx
"use client";

import { Button } from "../ui/button";
import DecisionPopup from "./decisionPopup";
import { ButtonFriendshipParams } from "@/types/friendship";

const FriendButton = ({
    userId,
    buttonParams,
    switchRequestPopup,
    onClickHandle,
    requestPopup,
}: {
    userId: number;
    buttonParams: ButtonFriendshipParams | undefined;
    switchRequestPopup: () => void;
    onClickHandle: (subject: string) => void;
    requestPopup: boolean;
}) => {
    if (!buttonParams) return null;

    // 👉 Estilos base para el “chip”
    const baseChip =
        "inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] leading-none whitespace-nowrap h-[16px]";


    const sendReqChip =
        baseChip +
        " border-sky-400 text-sky-200 bg-sky-900/30 hover:bg-sky-900/60";
    const areFriendsChip =
        baseChip +
        " border-yellow-400 text-yellow-200 bg-yellow-900/30 hover:bg-yellow-900/60";
    const wantBeFriendChip =
        baseChip +
        " border-pink-400 text-pink-200 bg-pink-900/30 hover:bg-pink-900/60";
    const sentReqChip =
        baseChip +
        " border-rose-400 text-rose-200 bg-rose-900/30";

    return (
        <div className="flex items-center h-[16px]">
            {/* === SON AMIGOS (actionYes = 6) === */}
            {buttonParams.actionYes === 6 && (
                <div className="relative flex items-center">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={switchRequestPopup}
                        className="p-0 bg-transparent hover:bg-transparent"
                    >
                        <span className={areFriendsChip}>
                            {buttonParams.text}
                        </span>
                    </Button>

                    {requestPopup && (
                        <DecisionPopup
                            question="¿Realmente quieres eliminar esta amistad?"
                            yesText={buttonParams.textYes || ""}
                            noText={buttonParams.textNo || ""}
                            onYes={() => {
                                onClickHandle("deleteFriendship");
                            }}
                            onNo={switchRequestPopup}
                        />
                    )}
                </div>
            )}

            {/* === ENVIAR SOLICITUD (actionYes = 2) === */}
            {buttonParams.actionYes === 2 && (
                <div className="flex flex-col items-start h-[16px]">
                    <Button
                        type="button"
                        onClick={() => {
                            onClickHandle("sendRequest");
                        }}
                        variant="ghost"
                        className="p-0 bg-transparent hover:bg-transparent"
                    >
                        <span className={sendReqChip}>{buttonParams.text}</span>
                    </Button>
                </div>
            )}

            {/* === QUIERE SER TU AMIGO (actionYes = 8) === */}
            {buttonParams.actionYes === 8 && (
                <div className="relative flex flex-col items-start">
                    <Button
                        type="button"
                        onClick={switchRequestPopup}
                        variant="ghost"
                        className="p-0 bg-transparent hover:bg-transparent"
                    >
                        <span className={wantBeFriendChip}>
                            {buttonParams.text}
                        </span>
                    </Button>

                    {requestPopup && (
                        <DecisionPopup
                            question="¿Cómo quieres responder a esta solicitud de amistad?"
                            yesText={buttonParams.textYes || ""}
                            noText={buttonParams.textNo || ""}
                            onYes={() => {
                                onClickHandle("acceptRequest");
                            }}
                            onNo={() => {
                                onClickHandle("rejectRequest");
                            }}
                        />
                    )}
                </div>
            )}

            {/* === YA ENVIADA (actionYes = 1) === */}
            {buttonParams.actionYes === 1 && (
                <div className="flex flex-col items-start h-[16px]">
                    <span className={sentReqChip}>{buttonParams.text}</span>
                </div>
            )}
        </div>
    );
};

export default FriendButton;
