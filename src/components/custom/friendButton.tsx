"use client";

import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import DecisionPopup from "./decisionPopup";

interface ButtonFriendshipParams {
    text: string | null
    actionYes?: number | null,
    textYes?: string | null,
    actionNo?: number,
    textNo?: string
}

const FriendButton = ({
    userId,
    buttonParams,
    switchRequestPopup,
    onClickHandle,
    requestPopup
}: {
    userId: number;
    buttonParams: ButtonFriendshipParams | undefined
    switchRequestPopup: () => void
    onClickHandle: (subject: string) => void
    requestPopup: boolean
}) => {


    return (
        <div className="friendshipButton">
            {buttonParams && buttonParams.actionYes === 6 &&
                <div className="flex flex-row items-center">
                    {/* es tu amigo */}
                    <Button onClick={switchRequestPopup}>
                        <span id="friendshipAreFriendsButton" className="userProfileMiniCardButton">
                            {buttonParams.text}
                        </span>
                    </Button>
                    {requestPopup &&
                        <DecisionPopup
                            question="¿Realmente quieres eliminar esta amistad?"
                            yesText={buttonParams.textYes || ""}
                            noText={buttonParams.textNo || ""}
                            onYes={() => { onClickHandle("deleteFriendship") }}
                            onNo={switchRequestPopup}
                        ></DecisionPopup>}
                </div>
            }
            {/* enviar solicitud de amistad */}
            {buttonParams &&
                buttonParams.actionYes === 2 &&
                <Button onClick={() => { onClickHandle("sendRequest") }}>
                    <span id="friendshipRequestSendButton" className="userProfileMiniCardButton">
                        {buttonParams.text}
                    </span>
                </Button>
            }

            {buttonParams && buttonParams.actionYes === 8 &&

                <div className="flex flex-col items-center">
                    {/* quiere ser tu amigo */}
                    <Button onClick={switchRequestPopup}>
                        <span id="frienshipWantBeFriendButton" className="userProfileMiniCardButton">
                            {buttonParams.text}
                        </span>
                    </Button>
                    {requestPopup &&
                        <div className="relative left-[-60px]">
                            <DecisionPopup
                                question="¿Cómo quieres responder a esta solicitud de amistad?"
                                yesText={buttonParams.textYes || ""}
                                noText={buttonParams.textNo || ""}
                                onYes={() => { onClickHandle("acceptRequest") }}
                                onNo={() => { onClickHandle("rejectRequest") }}
                            ></DecisionPopup>

                        </div>

                    }
                </div>
            }



            {buttonParams && buttonParams.actionYes === 1 &&
                <div className="flex flex-col items-center">
                    {/* cancelar solicitud de amistad */}
                    <div className="flex flex-row items-center">
                        <span id="friendshipRequestSentButton" className="userProfileMiniCardButton">
                            {buttonParams.text}
                        </span>
                    </div>
                    {/*requestPopup &&
                        <DecisionPopup
                            question="¿Quieres cancelar la solicitud de amistad que has enviado?"
                            yesText={buttonParams.textYes || ""}
                            noText={buttonParams.textNo || ""}
                            onYes={() => onClickHandle("cancelRequest")}
                            onNo={switchRequestPopup}
                        ></DecisionPopup>*/}
                </div>
            }


        </div>
    );
};

export default FriendButton;

// "sendRequest" "acceptRequest" "rejectRequest" "deleteFriendship" "cancelRequest"
// <DecisionPopup question="pregunta?" yesText="Si" noText="no, no quiero aceptar la solicitud de amistad" onYes={yestest} onNo={notest}></DecisionPopup>