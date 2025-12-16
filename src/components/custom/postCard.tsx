import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import UserProfileMiniCard from "./userProfileMiniCard";
import FriendshipRequest from "./friendshipRequest";
import { useRouter } from "next/navigation";

export function PostCard({ session, post }: {
    session: any
    post: Post
}) {
    const router = useRouter();
    return (
        <div
            className={post.active === 0 ?
                "flex flex-col bg-black border-2 border-solid border-red-500 p-2 shadow-md w-full max-h-[200px] overflow-hidden text-gray-200"
                :
                "postCardActive"
            }
        >
            {post.active === 0 && <span className="text-red-500">oculto</span>}
            {/*<div className="flex flex-col bg-black justify-between w-full text-gray-200 border-b-2">*/}
            {post.userData && post.userData.imageUrl && (
                <UserProfileMiniCard
                    session={session}
                    userId={post.userData.id}
                    userName={post.userData.name}
                    profileImageUrl={post.userData.imageUrl}
                    following={post.relations.following}
                    isFollower={post.relations.isFollower}
                    isFriend={post.relations.isFriend}
                ></UserProfileMiniCard>

            )}
            <span className="text-[10px] ">{formatDate(post.createdAt)}</span>
            {/*</div>*/}
            <Link href={`/showpost?post_id=${post.id}`} >
                <h3 className="text-lg font-semibold mt-2">{post.title}</h3>
            </Link>
            {post.active === 1 &&
                post.images && post.images.length > 0 && (
                    <div className="flex flex-row flex-wrap justify-between gap-3">

                        {post.images.map((img, index) =>
                            img ? (
                                <div
                                    key={`${img.post_id}-${img.id}-${img.index}-${index}`}
                                    className={index == 0 ?
                                        "flex flex-row gap-2 bg-black relative w-full aspect-square overflow-hidden border border-blue-500 rounded-[8px]"
                                        :
                                        "flex flex-row gap-2 bg-black relative w-[48%] aspect-square overflow-hidden border border-blue-500 rounded-[8px]"
                                    }
                                >
                                    <div
                                        onDoubleClick={() => router.push(`/showpost?post_id=${post.id}`)}
                                        className="cursor-zoom-in select-none">
                                        <Image
                                            src={img.imageUrl}
                                            alt={`Imagen ${index}`}

                                            fill={true}
                                            sizes="100vw"
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            ) : null
                        )}
                        {/*<pre className="text-gray-200 w-[500px] text-wrap bg-black">{post.description}</pre>*/}

                    </div>
                )
            }
            {post.active === 0 &&
                <div className="flex flex-row gap-2 relative w-full aspect-square overflow-hidden">
                    <Link
                        href={`/showpost?post_id=${post.id}`}>
                        {post.images?.length != 0 && post.images != undefined &&
                            <Image
                                src={post?.images[0].imageUrl}
                                alt={`Imagen del post`}
                                fill={true}
                                sizes="100vw"
                                className="object-contain"
                            />
                        }
                    </Link>

                </div>
            }
            <pre className="text-gray-200 w-full text-wrap">{post.description}</pre>
        </div>
    );
}
