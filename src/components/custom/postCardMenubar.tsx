import { useState } from "react";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar";
import { EllipsisVertical } from "lucide-react";
import DecisionPopup from "./decisionPopup";

interface ButtonFriendshipParams {
    text: string | null
    actionYes?: number | null,
    textYes?: string | null,
    actionNo?: number,
    textNo?: string
}

export default function PostCardMenubar({
    following,
    followingId,
    onclickfollowing,
    buttonFriendshipParams,
    switchRequestPopup,
    onclickfriendship,
    requestPopup,
}: {
    following: Boolean
    followingId: Number
    onclickfollowing: () => void | Promise<void>
    buttonFriendshipParams: ButtonFriendshipParams | undefined
    switchRequestPopup: () => void
    onclickfriendship: (subject: string) => void
    requestPopup: boolean
}) {

    return (
        <div>
            <div className="relative left-[-300px]">
                {requestPopup && buttonFriendshipParams && buttonFriendshipParams.actionYes === 1 &&
                    <DecisionPopup
                        question="¿Quieres cancelar la solicitud de amistad que has enviado?"
                        yesText={buttonFriendshipParams?.textYes || ""}
                        noText={buttonFriendshipParams?.textNo || ""}
                        onYes={() => onclickfriendship("cancelRequest")}
                        onNo={switchRequestPopup}
                    ></DecisionPopup>
                }
                {requestPopup && buttonFriendshipParams && buttonFriendshipParams.actionYes === 6 &&
                    <DecisionPopup
                        question="¿Seguro que quieres eliminar la amistad?"
                        yesText={buttonFriendshipParams?.textYes || ""}
                        noText={buttonFriendshipParams?.textNo || ""}
                        onYes={() => onclickfriendship("deleteFriendship")}
                        onNo={switchRequestPopup}
                    ></DecisionPopup>
                }
            </div>
            <Menubar className="border-none">
                <MenubarMenu>
                    <MenubarTrigger className="flex flex-col justify-center items-center">
                        <EllipsisVertical size={24}></EllipsisVertical>
                    </MenubarTrigger>
                    <MenubarContent className="bg-white rounded-[6px] relative left-[-140px]">
                        {following &&
                            <MenubarItem onClick={onclickfollowing}>
                                Dejar de seguir
                            </MenubarItem>
                        }
                        {/* cancelar solicitud de amistad */}
                        {buttonFriendshipParams && buttonFriendshipParams.actionYes === 1 &&
                            <>
                                <MenubarItem onClick={switchRequestPopup}>
                                    Cancelar solicitud de amistad
                                </MenubarItem>
                            </>
                        }
                        {/* es tu amigo */}
                        {buttonFriendshipParams && buttonFriendshipParams.actionYes === 6 &&
                            <>
                                <MenubarItem onClick={switchRequestPopup}>
                                    Eliminar de mis amigos

                                </MenubarItem>
                            </>

                        }
                        <MenubarItem onClick={() => console.log("Bloquear")}>
                            Bloquear
                        </MenubarItem>
                        <MenubarItem onClick={() => console.log("Reportar")}>
                            Reportar
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        </div>);
}
