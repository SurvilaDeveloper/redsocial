"use client";

import Image from "next/image";
import Link from "next/link";
import {
    Pencil,
    EyeOffIcon,
    EyeIcon,
    Trash2,
    Earth,
    UserCheck,
    Footprints,
    Handshake,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { updatePostActive, updatePostVisibility } from "@/actions/post-action";
import type { PostApiResponse, PostApiOk, PostApiNoView } from "@/types/post-api";

export function Post({ postId }: { postId: number }) {
    const session = useSession();

    const [post, setPost] = useState<PostApiResponse | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    // UI states
    const [deleteAsk, setDeleteAsk] = useState(false);
    const [visibilityMenu, setVisibilityMenu] = useState(false);

    // para forzar refetch cuando cambie active
    const [activeTick, setActiveTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function fetchPost() {
            try {
                const res = await fetch(`/api/post?post_id=${postId}`, { cache: "no-store" });
                const data: PostApiResponse = await res.json();

                if (cancelled) return;

                setPost(data);

                // calcular owner si la API devolvió un post válido
                if (!("error" in data)) {
                    const viewerId = session.data?.user?.id ? Number(session.data.user.id) : null;
                    setIsOwner(Boolean(viewerId && viewerId === data.user_id));
                } else {
                    setIsOwner(false);
                }
            } catch (error) {
                console.error("Error al obtener el post:", error);
                if (!cancelled) setPost({ error: "Error al obtener el post" });
            }
        }

        fetchPost();

        return () => {
            cancelled = true;
        };
    }, [postId, session.data?.user?.id, activeTick]);

    const viewablePost = useMemo(() => {
        if (!post || "error" in post) return null;
        if (post.canView === false) return null;
        return post as PostApiOk;
    }, [post]);

    // ---- helpers UI ----
    const visibilityMsg = (p: PostApiNoView) => {
        switch (p.reason) {
            case "post_hidden":
                return "Este post está oculto por su autor";

            case "login_required":
                return "Debes iniciar sesión para ver este post";
            case "followers_or_friends_only":
                return "Debes ser seguidor o amigo para poder ver este post";
            case "friends_only":
                return "Debes ser amigo para poder ver este post";
            default:
                return "No tienes permisos para ver este post";
        }
    };

    async function hidePost() {
        if (!viewablePost) return;

        const currentActive = viewablePost.active ?? 1;
        const nextActive = currentActive === 1 ? 0 : 1;

        await updatePostActive(viewablePost.id, nextActive);
        setActiveTick((x) => x + 1);
    }

    async function updatePostVisibilityHandle(value: number) {
        if (!viewablePost) return;

        await updatePostVisibility(viewablePost.id, value);
        setVisibilityMenu(false);
        setActiveTick((x) => x + 1);
    }

    // ---- renders ----
    if (!post) {
        return <div>Cargando post...</div>;
    }

    if ("error" in post) {
        return <div className="text-red-500">{post.error}</div>;
    }

    if (post.canView === false) {
        return (
            <div className="flex flex-col items-center justify-center w-full p-6 rounded-lg bg-black text-white border border-blue-500">
                <p className="text-sm">{visibilityMsg(post)}</p>
            </div>
        );
    }

    // Desde acá TS sabe que es PostApiOk
    const p = post as PostApiOk;

    // imagen “principal” segura (si imagenumber es null o se pasa de rango)
    const mainImageIdx = (() => {
        const raw = p.imagenumber ?? 0;
        if (raw < 0) return 0;
        if (raw >= p.images.length) return 0;
        return raw;
    })();

    return (
        <div
            className={
                (p.active ?? 1) === 1
                    ? "flex flex-col items-center justify-center rounded-lg shadow-md w-full"
                    : "flex flex-col items-center justify-center bg-red-100 border border-red-500 border-solid p-2 rounded-lg shadow-md w-full"
            }
        >
            {/* TOP BAR OWNER */}
            <div className="flex flex-row w-full justify-start">
                {isOwner && (
                    <div className="flex flex-row w-full text-white bg-[rgb(62,62,62)] pl-4">
                        <Link
                            href={`/editpost?post_id=${p.id}`}
                            className="flex flex-row items-center justify-center pr-2"
                        >
                            <Pencil size={24} />
                        </Link>

                        {(p.active ?? 1) === 1 ? (
                            <Button onClick={hidePost}>
                                <EyeOffIcon size={24} />
                            </Button>
                        ) : (
                            <Button onClick={hidePost}>
                                <EyeIcon />
                                <span className="text-red-500 font-bold">oculto</span>
                            </Button>
                        )}

                        {/* DELETE ASK */}
                        <div className="relative">
                            <Button onClick={() => setDeleteAsk((v) => !v)}>
                                <Trash2 />
                            </Button>

                            {deleteAsk && (
                                <div className="flex flex-col absolute bg-yellow-100 p-4 gap-4 rounded-[8px] z-50">
                                    <p className="text-black">Are you sure you want to delete this post?</p>
                                    <div className="flex flex-row justify-between gap-2">
                                        <Button className="bg-green-400 rounded hover:bg-green-300">Yes</Button>
                                        <Button
                                            onClick={() => setDeleteAsk(false)}
                                            className="bg-red-400 rounded hover:bg-red-300"
                                        >
                                            No, I do NOT want
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* VISIBILITY */}
                        <div className="flex flex-row gap-2 relative">
                            {p.visibility === 1 && (
                                <Button onClick={() => setVisibilityMenu((v) => !v)}>
                                    <Earth />
                                </Button>
                            )}
                            {p.visibility === 2 && (
                                <Button onClick={() => setVisibilityMenu((v) => !v)}>
                                    <UserCheck />
                                </Button>
                            )}
                            {p.visibility === 3 && (
                                <Button onClick={() => setVisibilityMenu((v) => !v)}>
                                    <div className="flex flex-row gap-2">
                                        <Footprints />
                                        <Handshake />
                                    </div>
                                </Button>
                            )}
                            {p.visibility === 4 && (
                                <Button onClick={() => setVisibilityMenu((v) => !v)}>
                                    <Handshake />
                                </Button>
                            )}

                            {visibilityMenu && (
                                <div className="flex flex-col absolute bg-black top-12 left-0 items-start border border-black rounded-[6px] z-50">
                                    <Button onClick={() => updatePostVisibilityHandle(1)}>
                                        <div className="flex flex-row gap-2">
                                            <Earth />
                                            <span>Lo puede ver todo el mundo</span>
                                        </div>
                                    </Button>

                                    <Button onClick={() => updatePostVisibilityHandle(2)}>
                                        <div className="flex flex-row gap-2">
                                            <UserCheck />
                                            <span>Lo pueden ver solamente los usuarios logueados</span>
                                        </div>
                                    </Button>

                                    <Button onClick={() => updatePostVisibilityHandle(3)}>
                                        <div className="flex flex-row gap-2">
                                            <Footprints />
                                            <Handshake />
                                            <span>Lo pueden ver solamente tus seguidores y amigos</span>
                                        </div>
                                    </Button>

                                    <Button onClick={() => updatePostVisibilityHandle(4)}>
                                        <div className="flex flex-row gap-2">
                                            <Handshake />
                                            <span>Solamente tus amigos</span>
                                        </div>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <h3 className="text-lg font-semibold mt-2">{p.title}</h3>

            {p.images.length > 0 && p.images[mainImageIdx] ? (
                <div className="flex flex-col items-center w-full h-auto">
                    <Image
                        src={p.images[mainImageIdx].imageUrl}
                        alt="Imagen de muestra"
                        width={1024}
                        height={1024}
                    />
                </div>
            ) : null}

            <div className="w-full max-w-[800px] p-2">
                <pre className="text-white w-full whitespace-pre-wrap break-words">
                    {p.description ?? ""}
                </pre>
            </div>

            {p.images.length > 1 && (
                <div className="flex flex-col items-center gap-2 w-full">
                    {p.images.map((img, index) =>
                        index !== 0 ? (
                            <div key={img.id} className="flex flex-col items-center w-full h-auto">
                                <Link href={`/showpost?post_id=${img.post_id}`}>
                                    <Image src={img.imageUrl} alt={`Imagen ${index}`} width={1024} height={1024} />
                                    <p className="text-white">Index: {index}</p>
                                </Link>
                            </div>
                        ) : null
                    )}
                </div>
            )}
        </div>
    );
}


