//src/actions/post-action.ts

"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { postSchema } from "@/lib/zod";
import { z } from "zod";

// src/actions/post-action.ts

export const createPost = async (
    values: z.infer<typeof postSchema>,
    mainImage: {
        url: string;
        publicId: string;
    } | null,
    imagesAdded?: ({
        url: string;
        publicId: string;
    } | null)[]
) => {
    console.log("image en post-action: ", mainImage);
    console.log("imagesAdded en post-action: ", imagesAdded);

    const session = await auth();
    console.log("session en post-action: ", session);

    if (!session) {
        return {
            error: "No logged user.",
        };
    }

    try {
        const parsed = postSchema.safeParse(values);
        if (!parsed.success) {
            return {
                error: "Invalid data.",
            };
        }

        const data = parsed.data;
        const userId = parseInt(String(session.user.id), 10);

        const accessoryImages = imagesAdded ?? [];
        const accessoryCount = accessoryImages.filter(Boolean).length;
        const mainCount = mainImage ? 1 : 0;
        const totalImages = mainCount + accessoryCount;

        // 👉 Crear el post primero
        const post = await prisma.post.create({
            data: {
                title: data.title,
                description: data.description,
                imagenumber: totalImages, // si querés mantener 0, podés poner 0 aquí
                user_id: userId,
            },
        });

        // 👉 Guardar imagen principal (index 0)
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

        // 👉 Guardar imágenes accesorias (index 1, 2, 3, ...)
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

        return { success: true };
    } catch (error) {
        console.error("Error en createPost:", error);
        return { error: "error 500" };
    }
};


export const updatePost = async (
    values: z.infer<typeof postSchema>,
    image: {
        url: string,
        publicId: string
    } | null,
    imagesAdded: ({
        url: string,
        publicId: string
    } | null)[],
    imagesToDelete: ({
        url: string,
        publicId: string
    } | null)[],
    postId: number
) => {
    const session = await auth()
    console.log("session en post-action: ", session);
    if (!session) {
        return {
            error: "No logged user."
        }
    }
    try {
        const { data, success } = postSchema.safeParse(values)
        if (!success) {
            return {
                error: "Invalid data.",
            }
        }
        // Obtener el ID del usuario autenticado
        const userId = session.user.id;
        // verificar la cantidad de imagenes del usuario en la tabla image

        try {


            await Promise.all(imagesToDelete.map(async (image) => {
                if (image) {
                    const img = await prisma.image.findFirst({
                        where: {
                            post_id: postId,
                            imageUrl: image.url,
                            imagePublicId: image.publicId
                        }
                    });
                    if (img?.id) {
                        await prisma.image.delete({ where: { id: img.id } });
                    }
                }
            }));

        } catch (error) {
            console.log("Error al eliminar registros de la db")
        }

        const post = await prisma.post.update({
            where: { id: postId },
            data: {
                title: data.title,
                description: data.description,
                imagenumber: 0,
                user_id: parseInt(userId),
            }
        });

        // guardar la imagen
        if (post && post.id) {

            const existingImage = await prisma.image.findFirst(
                {
                    where: {
                        post_id: post.id,
                        index: 0
                    }
                }
            )

            if (image) {

                if (existingImage) {
                    //update
                    await prisma.image.update(
                        {
                            where: {
                                id: existingImage.id
                            },
                            data: {
                                imageUrl: image.url,
                                imagePublicId: image.publicId
                            }
                        }
                    )
                } else {
                    await prisma.image.create(
                        {
                            data: {
                                imageUrl: image.url,
                                imagePublicId: image.publicId,
                                index: 0,
                                post_id: post.id,/* provide the post ID here */

                            }
                        })
                }
            }
            if (imagesAdded && imagesAdded.length > 0) {
                console.log("imagesAdded: ", imagesAdded);

                for (let i = 0; i < imagesAdded.length; i++) {
                    if (imagesAdded[i]) {
                        await prisma.image.upsert({
                            where: {
                                post_id_index: {
                                    post_id: post.id,
                                    index: i + 1
                                }
                            },
                            update: {
                                imageUrl: imagesAdded[i]!.url,
                                imagePublicId: imagesAdded[i]!.publicId
                            },
                            create: {
                                imageUrl: imagesAdded[i]!.url,
                                imagePublicId: imagesAdded[i]!.publicId,
                                index: i + 1,
                                post_id: post.id
                            }
                        });
                    }
                }


            }
        }
        return { success: true }
    } catch (error) {
        return { error: "error 500" }
    }
}

export const updatePostActive = async (postId: number, value: number) => {
    try {
        await prisma.post.update({
            where: { id: postId },
            data: { active: value }
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
            data: { visibility: value }
        });
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar (visibility) del post:", error);
        return { error: "Error al actualizar (visibility) del post" };
    }
}


export const softDeletePost = async (postId: number) => {
    const session = await auth();
    if (!session) {
        return { error: "No logged user." };
    }

    try {
        const userId = Number(session.user.id);

        await prisma.post.update({
            where: {
                id: postId,
                user_id: userId,
            },
            data: {
                deletedAt: new Date(), // 🧺 papelera
                active: 0,             // opcional: lo marcamos oculto
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
    if (!session) {
        return { error: "No logged user." };
    }

    try {
        const userId = Number(session.user.id);

        await prisma.post.update({
            where: {
                id: postId,
                user_id: userId,
            },
            data: {
                deletedAt: null, // 🔄 sale de la papelera
                // podés decidir si vuelve activo o no
                // active: 1,
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
    if (!session) {
        return { error: "No logged user." };
    }

    try {
        const userId = Number(session.user.id);

        // 🔹 TODO futuro: acá podrías borrar imágenes de Cloudinary.
        // Por ahora sólo lo sacamos de la DB.

        // Si tenés FKs sin cascade, quizá tengas que borrar también
        // comentarios, reacciones, etc. Ejemplo:
        // await prisma.post_comment.deleteMany({ where: { post_id: postId } });
        // await prisma.image.deleteMany({ where: { post_id: postId } });

        await prisma.post.delete({
            where: {
                id: postId,
                user_id: userId,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error en hardDeletePost:", error);
        return { error: "Error eliminando definitivamente el post." };
    }
};

