"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import UserProfileMiniCard from "./userProfileMiniCard";
import { useRouter } from "next/navigation";

export function PostCard({
    session,
    post,
}: {
    session: any;
    post: Post;
}) {
    const router = useRouter();

    const isLogged = Boolean(session?.user?.id);
    const isFriend = Boolean(post.relations?.isFriend);
    const following = Boolean(post.relations?.following);

    // ✅ Reglas visibility (seguro extra frontend)
    const viewerId = session?.user?.id ? Number(session.user.id) : null;
    const isOwner = viewerId !== null && viewerId === post.user_id;

    const canView =
        isOwner ||
        post.visibility === 1 ||
        (post.visibility === 2 && viewerId !== null) ||
        (post.visibility === 3 && viewerId !== null && (post.relations.isFriend || post.relations.following)) ||
        (post.visibility === 4 && viewerId !== null && post.relations.isFriend);


    if (!canView) {
        const msg =
            post.visibility === 2
                ? "Debes iniciar sesión para ver este post."
                : post.visibility === 3
                    ? "Debes ser seguidor o amigo para poder ver este post."
                    : "Debes ser amigo para poder ver este post.";

        return (
            <div className="postCardActive">
                <div className="text-xs text-yellow-300">{msg}</div>
            </div>
        );
    }

    return (
        <div className={post.active === 0 ? "flex flex-col bg-black border-2 border-solid border-red-500 p-2 shadow-md w-full max-h-[200px] overflow-hidden text-gray-200" : "postCardActive"}>
            {post.active === 0 && <span className="text-red-500">oculto</span>}

            {post.userData?.imageUrl && (
                <UserProfileMiniCard
                    session={session}
                    userId={post.userData.id}
                    userName={post.userData.name}
                    profileImageUrl={post.userData.imageUrl}
                    following={post.relations.following}
                    isFollower={post.relations.isFollower}
                    isFriend={post.relations.isFriend}
                />
            )}

            <span className="text-[10px]">{formatDate(post.createdAt)}</span>

            <Link href={`/showpost?post_id=${post.id}`}>
                <h3 className="text-lg font-semibold mt-2">{post.title}</h3>
            </Link>

            {post.images && post.images.length > 0 && (
                <div className="flex flex-row flex-wrap justify-between gap-3">
                    {post.images.map((img, index) =>
                        img ? (
                            <div
                                key={`${img.post_id}-${img.id}-${img.index}-${index}`}
                                className={
                                    index === 0
                                        ? "flex flex-row gap-2 bg-black relative w-full aspect-square overflow-hidden border border-blue-500 rounded-[8px]"
                                        : "flex flex-row gap-2 bg-black relative w-[48%] aspect-square overflow-hidden border border-blue-500 rounded-[8px]"
                                }
                            >
                                <div
                                    onDoubleClick={() => router.push(`/showpost?post_id=${post.id}`)}
                                    className="relative w-full h-full cursor-zoom-in select-none"
                                >
                                    <Image
                                        src={img.imageUrl}
                                        alt={`Imagen ${index}`}
                                        fill
                                        sizes="100vw"
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ) : null
                    )}
                </div>
            )}

            <pre className="text-gray-200 w-full whitespace-pre-wrap break-words">
                {post.description ?? ""}
            </pre>
        </div>
    );
}

