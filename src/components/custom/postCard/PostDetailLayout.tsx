// src/app/components/custom/postCard/postDetailLayout.tsx
"use client";

import { useEffect } from "react";
import { PostHeader } from "./PostHeader";
import { PostReactions } from "./PostReactions";
import PostImageCard from "../PostImageCard";
import { ImagesSwiper } from "../ImagesSwiper";
import PostCardCommentsContainer from "../postCardCommentsContainer";
import type PostCardCommentsResponsesContainerType from "../postCardCommentsResponsesContainer";
import { FeedMessage } from "../feedMessage";
import type { Configuration } from "@/types/configuration";

type LocalPostComment = PostComment & {
    __optimistic?: boolean;
    __error?: string | null;
};

type Props = {
    session: any;
    currentPost: Post;

    ownerConfiguration?: Configuration | null;

    isOwner: boolean;
    isDeleted: boolean;
    isActive: boolean;

    // media
    sortedImages: NonNullable<Post["images"]>;
    enableMedia: boolean;
    sessionUserId: number | null;

    // desc
    shownDesc: string;
    showFullDesc: boolean;
    onToggleDesc: () => void;

    // reactions
    canReact: boolean;
    postReaction: Reaction;
    likesCount: number;
    unlikesCount: number;
    onLike: () => void;
    onUnlike: () => void;

    // comments
    activeCommentsCount: number;
    localComments: LocalPostComment[];
    setLocalComments: React.Dispatch<React.SetStateAction<LocalPostComment[]>>;
    expandedCommentId: number | null;
    onToggleComment: (id: number) => void;
    commentRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
    newComment: string;
    setNewComment: React.Dispatch<React.SetStateAction<string>>;
    canCreatePostComment: boolean;
    commentLoading: boolean;
    commentMsg: string | null;
    submitPostComment: (e: React.FormEvent) => Promise<void>;
    PostCardCommentsResponsesContainer: typeof PostCardCommentsResponsesContainerType | any;
    enablePostComments: boolean;
    enablePostReplies: boolean;
};

export function PostDetailLayout({
    session,
    currentPost,
    ownerConfiguration,
    isOwner,
    isDeleted,
    isActive,
    sortedImages,
    enableMedia,
    enablePostComments,
    enablePostReplies,
    sessionUserId,
    shownDesc,
    showFullDesc,
    onToggleDesc,
    canReact,
    postReaction,
    likesCount,
    unlikesCount,
    onLike,
    onUnlike,
    activeCommentsCount,
    localComments,
    setLocalComments,
    expandedCommentId,
    onToggleComment,
    commentRefs,
    newComment,
    setNewComment,
    canCreatePostComment,
    commentLoading,
    commentMsg,
    submitPostComment,
    PostCardCommentsResponsesContainer,
}: Props) {
    const hasImages = sortedImages.length > 0;
    /*
        useEffect(() => {
            //console.log("[DETAIL] MOUNT", currentPost?.id);
    
            return () => {
                //console.log("[DETAIL] UNMOUNT", currentPost?.id);
            };
        }, []);
    */

    // DETAIL sin imágenes
    if (!hasImages) {
        return (
            <div className="flex flex-row items-center justify-center lg:overflow-y-auto overflow-hidden">
                <div className="lg:w-[45%] w-full lg:h-[calc(100dvh-106px)] min-h-0  lg:border-l border-neutral-800 lg:pl-3 lg:pr-2 ">
                    <section className="w-full flex flex-col gap-2">
                        {currentPost.author && (
                            <PostHeader
                                session={session}
                                user={currentPost.author}
                                createdAt={currentPost.createdAt}
                                title={currentPost.title}
                                relations={currentPost.relations}
                                postId={currentPost.id}
                            />
                        )}

                        <pre
                            onClick={onToggleDesc}
                            title={showFullDesc ? "Click para contraer" : "Click para ver completo"}
                            className="mt-2 text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
                        >
                            {shownDesc}
                        </pre>

                        <PostReactions
                            canReact={canReact}
                            postReaction={postReaction}
                            likesCount={likesCount}
                            unlikesCount={unlikesCount}
                            onLike={onLike}
                            onUnlike={onUnlike}
                        />
                    </section>

                    <section id="comments" className="w-full border-t border-neutral-800 pt-3 pb-6 ">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Comentarios ({activeCommentsCount})</span>
                        </div>

                        <PostCardCommentsContainer
                            session={session}
                            sessionUserId={sessionUserId}
                            postOwnerId={currentPost.authorId}
                            localComments={localComments}
                            setLocalComments={setLocalComments}
                            expandedCommentId={expandedCommentId}
                            onToggleComment={onToggleComment}
                            commentRefs={commentRefs}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            canCreatePostComment={canCreatePostComment}
                            commentLoading={commentLoading}
                            commentMsg={commentMsg}
                            submitPostComment={submitPostComment}
                            PostCardCommentsResponsesContainer={PostCardCommentsResponsesContainer}
                        />
                    </section>
                </div>
            </div>
        );
    }

    // DETAIL con imágenes
    return (
        <div className="m-0 flex flex-col lg:flex-row gap-4 lg:h-full min-h-0 bg-slate-950 overflow-hidden">
            {/* Header mobile */}
            <div className="lg:hidden block">
                {currentPost.author && (
                    <PostHeader
                        session={session}
                        user={currentPost.author}
                        createdAt={currentPost.createdAt}
                        title={currentPost.title}
                        relations={currentPost.relations}
                        postId={currentPost.id}
                    />
                )}
            </div>

            {/* Columna izquierda: media */}
            <div className="lg:w-[55%] lg:h-full min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 px-2 lg:px-0">
                    <section
                        className={
                            isOwner
                                ? isDeleted
                                    ? "w-full flex flex-col gap-2 h-[calc(100dvh-136px)]"
                                    : isActive
                                        ? "w-full flex flex-col gap-2 h-[calc(100dvh-136px)]"
                                        : "w-full flex flex-col gap-2 h-[calc(100dvh-186px)]"
                                : "w-full flex flex-col gap-2 h-[calc(100dvh-80px)]"
                        }
                    >
                        {enableMedia && (
                            <>
                                {sortedImages.length === 1 && (
                                    <PostImageCard image={sortedImages[0]} sessionUserId={sessionUserId} isFirst />
                                )}

                                {sortedImages.length > 1 && (
                                    <ImagesSwiper
                                        id={`post-${currentPost.id}`}
                                        imageArray={sortedImages as any}
                                        sessionUserId={sessionUserId}
                                        navigation="thumbnails"
                                        fit="height"
                                    />
                                )}
                            </>
                        )}
                    </section>
                </div>

                {/* footer reacciones */}
                <div className="shrink-0 pt-2 px-2 lg:px-0 border-t border-neutral-800/60 bg-slate-950">
                    <PostReactions
                        canReact={canReact}
                        postReaction={postReaction}
                        likesCount={likesCount}
                        unlikesCount={unlikesCount}
                        onLike={onLike}
                        onUnlike={onUnlike}
                    />
                </div>
            </div>

            {/* Columna derecha: desc + comments */}
            <aside className="lg:w-[45%] w-full lg:h-[calc(100dvh-150px)] min-h-0 lg:overflow-y-auto overflow-hidden lg:border-l border-neutral-800 lg:pl-3 lg:pr-2">
                <div className="shrink-0 pt-2">
                    {isDeleted && <p>Está eliminado</p>}

                    <div className="lg:block hidden">
                        {currentPost.author && (
                            <PostHeader
                                session={session}
                                user={currentPost.author}
                                createdAt={currentPost.createdAt}
                                title={currentPost.title}
                                relations={currentPost.relations}
                                postId={currentPost.id}
                            />
                        )}
                    </div>

                    <pre
                        onClick={onToggleDesc}
                        title={showFullDesc ? "Click para contraer" : "Click para ver completo"}
                        className="mt-2 text-gray-200 w-full whitespace-pre-wrap break-words cursor-pointer select-none"
                    >
                        {shownDesc}
                    </pre>

                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Comentarios ({activeCommentsCount})</span>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pb-4">
                    {enablePostComments ? (
                        <PostCardCommentsContainer
                            session={session}
                            sessionUserId={sessionUserId}
                            postOwnerId={currentPost.authorId}
                            localComments={localComments}
                            setLocalComments={setLocalComments}
                            expandedCommentId={expandedCommentId}
                            onToggleComment={onToggleComment}
                            commentRefs={commentRefs}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            canCreatePostComment={canCreatePostComment}
                            commentLoading={commentLoading}
                            commentMsg={commentMsg}
                            submitPostComment={submitPostComment}
                            PostCardCommentsResponsesContainer={PostCardCommentsResponsesContainer}
                        />
                    ) : (
                        <>
                            {ownerConfiguration?.postCommentsVisibility === 2 && (
                                <FeedMessage>Para poder ver los comentarios y comentar debes estar logueado.</FeedMessage>
                            )}
                            {ownerConfiguration?.postCommentsVisibility === 3 && (
                                <FeedMessage>
                                    Para poder ver los comentarios y comentar debes ser seguidor o amigo de este usuario.
                                </FeedMessage>
                            )}
                            {ownerConfiguration?.postCommentsVisibility === 4 && (
                                <FeedMessage>Para poder ver los comentarios y comentar debes ser amigo de este usuario.</FeedMessage>
                            )}
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}

