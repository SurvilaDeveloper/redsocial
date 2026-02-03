//src/components/postcard/OwnerToolbar.tsx
"use client";

import Link from "next/link";
import {
    Pencil,
    EyeOffIcon,
    EyeIcon,
    Earth,
    UserCheck,
    Footprints,
    Handshake,
    Trash2,
} from "lucide-react";

type Props = {
    isOwner: boolean;
    isDeleted: boolean;
    isActive: boolean;

    showOwnerPanel: boolean;
    enableOwnerControls: boolean;

    postId: number;
    visibility: PostVisibility;

    visibilityMenu: boolean;
    setVisibilityMenu: React.Dispatch<React.SetStateAction<boolean>>;

    ownerActionsLoading: boolean;

    onToggleActive: () => void;
    onOpenDelete: () => void;
    onChangeVisibility: (v: PostVisibility) => void;

    onRestore: () => void;
    onHardDelete: () => void;

    isPending: boolean;
    actionPostId: number | null;
};

export function OwnerToolbar({
    isOwner,
    isDeleted,
    isActive,
    showOwnerPanel,
    enableOwnerControls,
    postId,
    visibility,
    visibilityMenu,
    setVisibilityMenu,
    ownerActionsLoading,
    onToggleActive,
    onOpenDelete,
    onChangeVisibility,
    onRestore,
    onHardDelete,
    isPending,
    actionPostId,
}: Props) {
    if (!showOwnerPanel) return null;

    // NORMAL (no eliminado)
    if (isOwner && !isDeleted) {
        return (
            <div className="mb-2 flex flex-row items-center gap-2 w-full min-h-8 text-white bg-black px-3 py-2 rounded-md">
                <Link
                    href={`/editpost?post_id=${postId}`}
                    title="Editar"
                    className="flex flex-row items-center h-6 gap-1 text-[11px] px-2 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                >
                    <Pencil size={12} />
                </Link>

                <button
                    type="button"
                    onClick={onToggleActive}
                    disabled={ownerActionsLoading}
                    title={isActive ? "Ocultar" : "Mostrar"}
                    className={
                        isActive ?
                            "flex flex-row items-center h-6 gap-1 text-[11px] px-2 rounded bg-slate-800 border border-slate-600 hover:bg-red-800 disabled:opacity-50" :
                            "flex flex-row items-center h-6 gap-1 text-[11px] px-2 rounded bg-slate-800 border border-slate-600 hover:bg-green-800 disabled:opacity-50"
                    }
                >
                    {isActive ? (
                        <>
                            <EyeOffIcon size={12} />
                        </>
                    ) : (
                        <>
                            <EyeIcon size={12} />
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onOpenDelete}
                    disabled={ownerActionsLoading}
                    title="Enviar a la papelera de reciclaje"
                    className="flex flex-row items-center h-6 gap-1 text-[11px] px-2 rounded bg-slate-800 border border-slate-600 hover:bg-red-700 disabled:opacity-50"
                >
                    <Trash2 size={12} />
                </button>

                <div className="relative ml-auto">
                    <button
                        type="button"
                        onClick={() => setVisibilityMenu((v) => !v)}
                        disabled={ownerActionsLoading}
                        title="Visibilidad"
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
                    >
                        {visibility === 1 && <Earth size={16} />}
                        {visibility === 2 && <UserCheck size={16} />}
                        {visibility === 3 && (
                            <div className="flex flex-row gap-0.5">
                                <Footprints size={16} />
                                <Handshake size={16} />
                            </div>
                        )}
                        {visibility === 4 && <Handshake size={16} />}
                    </button>

                    {visibilityMenu && (
                        <div className="absolute right-0 mt-2 w-72 bg-black text-slate-100 border border-slate-700 rounded-lg shadow-lg z-50 text-xs overflow-hidden">
                            <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                onClick={() => onChangeVisibility(1)}
                            >
                                <Earth size={16} />
                                <span>Lo puede ver todo el mundo</span>
                            </button>

                            <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                onClick={() => onChangeVisibility(2)}
                            >
                                <UserCheck size={16} />
                                <span>Sólo usuarios logueados</span>
                            </button>

                            <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                onClick={() => onChangeVisibility(3)}
                            >
                                <Footprints size={16} />
                                <Handshake size={16} />
                                <span>Seguidores y amigos</span>
                            </button>

                            <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                                onClick={() => onChangeVisibility(4)}
                            >
                                <Handshake size={16} />
                                <span>Sólo amigos</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ELIMINADO
    if (enableOwnerControls && isOwner && isDeleted) {
        return (
            <div className="mb-2 flex flex-row flex-wrap items-center gap-2 w-full text-red-200 bg-[rgb(64,20,20)] px-3 py-2 rounded-md border border-red-700/40">
                <div className="text-xs font-semibold">
                    Este post está en la papelera de reciclaje.
                </div>

                <button
                    type="button"
                    onClick={onRestore}
                    disabled={isPending && actionPostId === postId}
                    className="ml-auto flex items-center justify-center bg-green-800 px-2 py-1 rounded-[6px] text-xs hover:bg-green-700 disabled:opacity-50"
                >
                    Restaurar
                </button>

                <button
                    type="button"
                    onClick={onHardDelete}
                    disabled={isPending && actionPostId === postId}
                    className="flex items-center justify-center bg-red-800 px-2 py-1 rounded-[6px] text-xs hover:bg-red-700 disabled:opacity-50"
                >
                    Eliminar definitivamente
                </button>
            </div>
        );
    }

    // OCULTO
    if (enableOwnerControls && isOwner && !isDeleted && !isActive) {
        return (
            <div className="mb-2 flex flex-row items-center gap-2 w-full text-red-200 bg-[rgb(64,20,20)] px-3 py-2 rounded-md border border-red-700/40">
                <div className="text-xs font-semibold">
                    Este post está oculto. Solamente tú puedes verlo en tu muro.
                </div>
            </div>
        );
    }

    return null;
}
