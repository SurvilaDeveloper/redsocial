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
        " border-blue-800 text-blue-500 bg-black hover:bg-blue-900/60";
    const areFriendsChip =
        baseChip +
        " border-orange-800 text-orange-500 bg-black hover:bg-orange-900/60";
    const wantBeFriendChip =
        baseChip +
        " border-pink-800 text-pink-500 bg-black hover:bg-pink-900/60";
    const sentReqChip =
        baseChip +
        " border-rose-900 text-rose-600 bg-black";

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
