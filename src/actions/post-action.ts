"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { postSchema } from "@/lib/zod";
import { z } from "zod";

export const createPost = async (
    values: z.infer<typeof postSchema>,
    image: {
        url: string,
        publicId: string
    } | null
) => {
    console.log("image en post-action: ", image);
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
        const userId = session.user.id;
        await prisma.post.create(
            {
                data: {
                    title: data.title,
                    description: data.description,
                    imagenumber: 0,
                    user_id: parseInt(userId),
                }
            }
        )

        if (image) {
            const post = await prisma.post.findFirst(
                {
                    where: {
                        user_id: parseInt(userId), //TODO cambiar por postid
                        title: data.title,
                        description: data.description
                    }
                }
            )
            // guardar la imagen
            if (post && post.id) {

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

        return { success: true }
    } catch (error) {
        return { error: "error 500" }
    }
}

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
