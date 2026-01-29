"use client";

import PostImageCard from "../PostImageCard";
import { ImagesSwiper } from "../ImagesSwiper";

type Props = {
    enableMedia: boolean;
    selectedViewModeState: number;
    sortedImages: NonNullable<Post["images"]>;
    sessionUserId: number | null;
    postId: number;
};

export function PostMedia({
    enableMedia,
    selectedViewModeState,
    sortedImages,
    sessionUserId,
    postId,
}: Props) {
    if (enableMedia) {
        return (
            <>
                {sortedImages.length === 1 && (
                    <div className="flex flex-row flex-wrap justify-between gap-3">
                        <PostImageCard image={sortedImages[0]} sessionUserId={sessionUserId} isFirst />
                    </div>
                )}

                {sortedImages.length > 1 && (
                    <ImagesSwiper
                        id={`post-${postId}`}
                        imageArray={sortedImages as any}
                        sessionUserId={sessionUserId}
                        navigation="thumbnails"
                    />
                )}
            </>
        );
    }

    if (sortedImages.length === 0) return null;

    if (selectedViewModeState === 1) {
        return <img src="/locked-logged.svg" alt="Imagen disponible solo para usuarios logueados" />;
    }
    if (selectedViewModeState === 2) {
        return <img src="/locked-followers.svg" alt="Imagen disponible solo para seguidores o amigos" />;
    }
    if (selectedViewModeState === 3) {
        return <img src="/locked-friends.svg" alt="Imagen disponible solo para amigos" />;
    }

    return null;
}
