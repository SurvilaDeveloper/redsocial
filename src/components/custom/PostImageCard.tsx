// src/components/custom/PostImageCard.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ThumbsUp, ThumbsDown } from "lucide-react";

type ImageReaction = "LIKE" | "UNLIKE" | null;

interface PostImageProps {
    image: {
        id: number;
        post_id: number;
        imageUrl: string;
        imagePublicId: string;
        index: number;
        active?: number | null;
        likesCount?: number;
        unlikesCount?: number;
        userReaction?: ImageReaction;
    };
    sessionUserId: number | null;
    isFirst: boolean;
    /** 🆕 Callback opcional para abrir detalle de imagen */
    onOpenImageDetail?: (imageId: number, postId: number) => void;
}

export default function PostImageCard({
    image,
    sessionUserId,
    isFirst,
    onOpenImageDetail,
}: PostImageProps) {
    const [reaction, setReaction] = useState<ImageReaction>(
        image.userReaction ?? null
    );
    const [likesCount, setLikesCount] = useState<number>(
        image.likesCount ?? 0
    );
    const [unlikesCount, setUnlikesCount] = useState<number>(
        image.unlikesCount ?? 0
    );
    const [loading, setLoading] = useState(false);

    // 👇 estado de carga de la imagen
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        setReaction(image.userReaction ?? null);
        setLikesCount(image.likesCount ?? 0);
        setUnlikesCount(image.unlikesCount ?? 0);
        setIsImageLoaded(false); // reset loader cuando cambia la imagen
    }, [
        image.id,
        image.userReaction,
        image.likesCount,
        image.unlikesCount,
        image.imageUrl,
    ]);

    const canReact = Boolean(sessionUserId) && !loading;

    const updateCountsOptimistic = (
        prev: ImageReaction,
        next: ImageReaction
    ) => {
        setLikesCount((prevLikes) => {
            let v = prevLikes;
            if (prev === "LIKE") v -= 1;
            if (next === "LIKE") v += 1;
            return v < 0 ? 0 : v;
        });

        setUnlikesCount((prevUnlikes) => {
            let v = prevUnlikes;
            if (prev === "UNLIKE") v -= 1;
            if (next === "UNLIKE") v += 1;
            return v < 0 ? 0 : v;
        });
    };

    const sendReaction = async (next: ImageReaction) => {
        if (!canReact) return;

        const prev = reaction;

        setReaction(next);
        updateCountsOptimistic(prev, next);
        setLoading(true);

        try {
            const res = await fetch(`/api/images/${image.id}/reaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: next }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                updateCountsOptimistic(next, prev);
                setReaction(prev);
                console.error(data?.error || "Error en reacción de imagen");
                return;
            }

            if (data?.counts) {
                setLikesCount(data.counts.likes ?? 0);
                setUnlikesCount(data.counts.unlikes ?? 0);
            }
            if (typeof data?.userReaction !== "undefined") {
                setReaction(data.userReaction as ImageReaction);
            }
        } catch (err) {
            updateCountsOptimistic(next, prev);
            setReaction(prev);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = () => {
        const next: ImageReaction = reaction === "LIKE" ? null : "LIKE";
        sendReaction(next);
    };

    const handleUnlike = () => {
        const next: ImageReaction = reaction === "UNLIKE" ? null : "UNLIKE";
        sendReaction(next);
    };

    return (
        <div
            className={
                isFirst
                    ? "flex flex-col gap-1 bg-black relative w-full aspect-square overflow-hidden border border-blue-500 rounded-[8px]"
                    : "flex flex-col gap-1 bg-black relative w-[48%] aspect-square overflow-hidden border border-blue-500 rounded-[8px]"
            }
        >
            <div

                onDoubleClick={() =>
                    onOpenImageDetail?.(image.id, image.post_id)
                }
                className="relative w-full h-full cursor-zoom-in select-none"
            >
                {/* Overlay de carga */}
                {!isImageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                        <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                )}

                <Image
                    src={image.imageUrl}
                    alt={`Imagen ${image.index}`}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                    className={`object-contain transition-opacity duration-300 ${isImageLoaded ? "opacity-100" : "opacity-0"
                        }`}
                    draggable={false}
                    onLoad={() => setIsImageLoaded(true)}
                />
            </div>

            {/* barra de reacciones debajo de la imagen */}
            <div className="flex flex-row items-center justify-start gap-2 p-1">
                <button
                    type="button"
                    onClick={handleLike}
                    disabled={!canReact}
                    className={`flex flex-row items-center gap-1 text-[10px] px-2 py-1 rounded border ${reaction === "LIKE"
                        ? "bg-green-700 border-green-400 text-white"
                        : "bg-transparent border-gray-500 text-gray-300"
                        } ${!canReact
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{likesCount}</span>
                </button>

                <button
                    type="button"
                    onClick={handleUnlike}
                    disabled={!canReact}
                    className={`flex flex-row items-center gap-1 text-[10px] px-2 py-1 rounded border ${reaction === "UNLIKE"
                        ? "bg-red-700 border-red-400 text-white"
                        : "bg-transparent border-gray-500 text-gray-300"
                        } ${!canReact
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                >
                    <ThumbsDown className="w-3 h-3" />
                    <span>{unlikesCount}</span>
                </button>
            </div>
        </div>
    );
}
/*
---

### ¿Y el futuro detalle de imagen?

Cuando más adelante hagas una page tipo `/image/[id]`, lo único que tenés que hacer es, desde el padre (por ejemplo donde usás `PostImageCard`):

```tsx
import { useRouter } from "next/navigation";

// ...

const router = useRouter();

// ...

<PostImageCard
  image={img}
  sessionUserId={sessionUserId}
  isFirst={index === 0}
  onOpenImageDetail={(imageId, postId) => {
    router.push(`/image/${imageId}`); // o `/post/${postId}/image/${imageId}`
  }}
/>
*/


