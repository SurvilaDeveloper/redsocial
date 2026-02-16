// src/actions/post-action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { postSchema } from "@/lib/zod";
import { z } from "zod";

import { getSocialRelations } from "@/lib/social-relations";
import { RelationshipState } from "@/lib/relationship-state";

import { upsertPostKeywords } from "@/lib/interests/postKeywords";

type ImagePayload = { url: string; publicId: string } | null;

async function canPublishOnWall(opts: {
    actorUserId: number;
    wallUserId: number;
}): Promise<boolean> {
    const { actorUserId, wallUserId } = opts;

    if (actorUserId === wallUserId) return true;

    const social = await getSocialRelations(actorUserId, wallUserId);
    return social?.relState === RelationshipState.FRIENDS;
}

export const createPost = async (
    values: z.infer<typeof postSchema>,
    mainImage: { url: string; publicId: string } | null,
    imagesAdded?: ({ url: string; publicId: string } | null)[],
    wallUserId?: number
) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "No logged user." };
    }

    const parsed = postSchema.safeParse(values);
    if (!parsed.success) {
        return { error: "Invalid data." };
    }

    const actorUserId = Number(session.user.id);

    const targetWallUserId = Number.isFinite(Number(wallUserId))
        ? Number(wallUserId)
        : actorUserId;

    // ✅ permiso: dueño del muro o amigo del dueño del muro
    const social = await getSocialRelations(actorUserId, targetWallUserId);
    const canPublish =
        actorUserId === targetWallUserId || social.relState === RelationshipState.FRIENDS;

    if (!canPublish) {
        return { error: "No tienes permiso para publicar en este muro." };
    }

    try {
        const data = parsed.data;

        const accessoryImages = imagesAdded ?? [];
        const accessoryCount = accessoryImages.filter(Boolean).length;
        const mainCount = mainImage ? 1 : 0;
        const totalImages = mainCount + accessoryCount;

        // 1) crear post
        const post = await prisma.post.create({
            data: {
                title: data.title,
                description: data.description,
                imagenumber: totalImages,
                authorId: actorUserId,
            },
        });

        // ✅ regla: solo sale al feed global si es post en muro propio
        const isOwnWall = actorUserId === targetWallUserId;

        const now = new Date();

        // 2) crear WallEntry (PUBLISHED) para que aparezca en el muro correcto
        await prisma.wallEntry.create({
            data: {
                wallUserId: targetWallUserId,
                actorUserId: actorUserId,
                type: "PUBLISHED",
                postId: post.id,
                showInFeed: isOwnWall,
                active: 1,
                visibility: 1,
                eventAt: now, // ✅ NUEVO: timeline por eventAt
            },
        });

        // 3) guardar imágenes
        let nextIndex = 0;

        if (mainImage) {
            await prisma.image.create({
                data: {
                    imageUrl: mainImage.url,
                    imagePublicId: mainImage.publicId,
                    index: 0,
                    post_id: post.id,
                },
            });
            nextIndex = 1;
        }

        if (accessoryImages.length > 0) {
            for (let i = 0; i < accessoryImages.length; i++) {
                const img = accessoryImages[i];
                if (!img) continue;

                await prisma.image.create({
                    data: {
                        imageUrl: img.url,
                        imagePublicId: img.publicId,
                        index: nextIndex,
                        post_id: post.id,
                    },
                });

                nextIndex++;
            }
        }

        // 4) ✅ precompute keywords (best-effort, no rompe el post)
        try {
            await upsertPostKeywords(post.id, {
                titleWeight: 3,
                descriptionWeight: 1,
                maxKeywords: 30,
                language: "es",
                version: 1,
            });
        } catch (e) {
            console.warn("upsertPostKeywords failed (createPost)", e);
        }

        return { success: true };
    } catch (error) {
        console.error("Error en createPost:", error);
        return { error: "error 500" };
    }
};

export const updatePost = async (
    values: z.infer<typeof postSchema>,
    image: ImagePayload,
    imagesAdded: ImagePayload[],
    imagesToDelete: ImagePayload[],
    postId: number
) => {
    const session = await auth();
    if (!session?.user?.id) return { error: "No logged user." };

    const parsed = postSchema.safeParse(values);
    if (!parsed.success) return { error: "Invalid data." };

    const actorUserId = Number(session.user.id);

    try {
        await prisma.$transaction(async (tx) => {
            // Solo el autor puede editar
            const post = await tx.post.findUnique({
                where: { id: postId },
                select: { id: true, authorId: true },
            });

            if (!post || post.authorId !== actorUserId) {
                throw new Error("Forbidden");
            }

            // borrar imágenes seleccionadas
            await Promise.all(
                (imagesToDelete ?? []).map(async (img) => {
                    if (!img) return;

                    const found = await tx.image.findFirst({
                        where: {
                            post_id: postId,
                            imageUrl: img.url,
                            imagePublicId: img.publicId,
                        },
                        select: { id: true },
                    });

                    if (found?.id) {
                        await tx.image.delete({ where: { id: found.id } });
                    }
                })
            );

            // actualizar post
            await tx.post.update({
                where: { id: postId },
                data: {
                    title: parsed.data.title,
                    description: parsed.data.description,
                },
            });

            // imagen principal index 0
            const existingMain = await tx.image.findFirst({
                where: { post_id: postId, index: 0 },
                select: { id: true },
            });

            if (image) {
                if (existingMain?.id) {
                    await tx.image.update({
                        where: { id: existingMain.id },
                        data: {
                            imageUrl: image.url,
                            imagePublicId: image.publicId,
                            active: 1,
                        },
                    });
                } else {
                    await tx.image.create({
                        data: {
                            imageUrl: image.url,
                            imagePublicId: image.publicId,
                            index: 0,
                            post_id: postId,
                        },
                    });
                }
            }

            // accesorias index 1..n
            if (imagesAdded && imagesAdded.length > 0) {
                for (let i = 0; i < imagesAdded.length; i++) {
                    const img = imagesAdded[i];
                    if (!img) continue;

                    await tx.image.upsert({
                        where: {
                            post_id_index: { post_id: postId, index: i + 1 },
                        },
                        update: {
                            imageUrl: img.url,
                            imagePublicId: img.publicId,
                            active: 1,
                        },
                        create: {
                            imageUrl: img.url,
                            imagePublicId: img.publicId,
                            index: i + 1,
                            post_id: postId,
                        },
                    });
                }
            }
        });

        // ✅ precompute keywords (best-effort) después de la tx
        try {
            await upsertPostKeywords(postId, {
                titleWeight: 3,
                descriptionWeight: 1,
                maxKeywords: 30,
                language: "es",
                version: 1,
            });
        } catch (e) {
            console.warn("upsertPostKeywords failed (updatePost)", e);
        }

        return { success: true };
    } catch (error) {
        if ((error as any)?.message === "Forbidden") return { error: "Forbidden" };
        console.error("Error en updatePost:", error);
        return { error: "error 500" };
    }
};

export const updatePostActive = async (postId: number, value: number) => {
    try {
        await prisma.post.update({
            where: { id: postId },
            data: { active: value },
        });
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar (active) del post:", error);
        return { error: "Error al actualizar (active) del post" };
    }
};

export const updatePostVisibility = async (postId: number, value: number) => {
    try {
        await prisma.post.update({
            where: { id: postId },
            data: { visibility: value },
        });
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar (visibility) del post:", error);
        return { error: "Error al actualizar (visibility) del post" };
    }
};

export const softDeletePost = async (postId: number) => {
    const session = await auth();
    if (!session?.user?.id) return { error: "No logged user." };

    try {
        const userId = Number(session.user.id);

        await prisma.post.update({
            where: {
                id: postId,
                authorId: userId,
            },
            data: {
                deletedAt: new Date(),
                active: 0,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error en softDeletePost:", error);
        return { error: "Error eliminando post." };
    }
};

export const restorePost = async (postId: number) => {
    const session = await auth();
    if (!session?.user?.id) return { error: "No logged user." };

    try {
        const userId = Number(session.user.id);

        await prisma.post.update({
            where: {
                id: postId,
                authorId: userId,
            },
            data: {
                deletedAt: null,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error en restorePost:", error);
        return { error: "Error restaurando post." };
    }
};

export const hardDeletePost = async (postId: number) => {
    const session = await auth();
    if (!session?.user?.id) return { error: "No logged user." };

    try {
        const userId = Number(session.user.id);

        await prisma.post.delete({
            where: {
                id: postId,
                authorId: userId,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error en hardDeletePost:", error);
        return { error: "Error eliminando definitivamente el post." };
    }
};
