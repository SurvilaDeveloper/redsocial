// src/components/custom/postCardMenubar.tsx

import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
} from "@/components/ui/menubar";
import { EllipsisVertical } from "lucide-react";
import DecisionPopup from "./decisionPopup";

import { ButtonFriendshipParams } from "@/types/friendship";

export default function PostCardMenubar({
    following,
    followingId,
    onclickfollowing,
    buttonFriendshipParams,
    switchRequestPopup,
    onclickfriendship,
    requestPopup,
}: {
    following: boolean;
    followingId: number;
    onclickfollowing: () => void | Promise<void>;
    buttonFriendshipParams: ButtonFriendshipParams | undefined;
    switchRequestPopup: () => void;
    onclickfriendship: (subject: string) => void;
    requestPopup: boolean;
}) {
    return (
        <div className="relative flex items-center">
            {/* Popups de confirmación para acciones de amistad (cancelar / eliminar) */}
            {requestPopup && buttonFriendshipParams && (
                <div className="absolute right-10 top-0">
                    {buttonFriendshipParams.actionYes === 1 && (
                        <DecisionPopup
                            question="¿Quieres cancelar la solicitud de amistad que has enviado?"
                            yesText={buttonFriendshipParams.textYes || ""}
                            noText={buttonFriendshipParams.textNo || ""}
                            onYes={() => onclickfriendship("cancelRequest")}
                            onNo={switchRequestPopup}
                        />
                    )}

                    {buttonFriendshipParams.actionYes === 6 && (
                        <DecisionPopup
                            question="¿Seguro que quieres eliminar la amistad?"
                            yesText={buttonFriendshipParams.textYes || ""}
                            noText={buttonFriendshipParams.textNo || ""}
                            onYes={() => onclickfriendship("deleteFriendship")}
                            onNo={switchRequestPopup}
                        />
                    )}
                </div>
            )}

            <Menubar className="border-none bg-transparent shadow-none">
                <MenubarMenu>
                    <MenubarTrigger className="flex items-center justify-center p-0 hover:bg-transparent">
                        <EllipsisVertical className="w-5 h-5 text-slate-200 hover:text-white" />
                    </MenubarTrigger>
                    <MenubarContent className="bg-slate-900 text-slate-100 border border-slate-700 rounded-md shadow-lg py-1 text-xs min-w-[180px]">
                        {following && (
                            <MenubarItem
                                onClick={onclickfollowing}
                                className="cursor-pointer hover:bg-slate-800"
                            >
                                Dejar de seguir
                            </MenubarItem>
                        )}

                        {/* cancelar solicitud de amistad */}
                        {buttonFriendshipParams &&
                            buttonFriendshipParams.actionYes === 1 && (
                                <MenubarItem
                                    onClick={switchRequestPopup}
                                    className="cursor-pointer hover:bg-slate-800"
                                >
                                    Cancelar solicitud de amistad
                                </MenubarItem>
                            )}

                        {/* es tu amigo */}
                        {buttonFriendshipParams &&
                            buttonFriendshipParams.actionYes === 6 && (
                                <MenubarItem
                                    onClick={switchRequestPopup}
                                    className="cursor-pointer hover:bg-slate-800"
                                >
                                    Eliminar de mis amigos
                                </MenubarItem>
                            )}

                        <MenubarItem
                            onClick={() => console.log("Bloquear")}
                            className="cursor-pointer hover:bg-slate-800"
                        >
                            Bloquear
                        </MenubarItem>
                        <MenubarItem
                            onClick={() => console.log("Reportar")}
                            className="cursor-pointer hover:bg-slate-800"
                        >
                            Reportar
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        </div>
    );
}
