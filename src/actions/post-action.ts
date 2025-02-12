"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; // Para obtener el usuario autenticado
import { postSchema } from "@/lib/zod";
import { z } from "zod";

export const createPost = async (
    values: z.infer<typeof postSchema>,
    image: string
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
        /*const images = await prisma.image.findMany(
            {
                where: {
                    post_user_id: parseInt(userId),
                    post_id: parseInt(userId)
                }
            }
        )*/
        // const imagesAumont = images.length;
        // console.log("images: ", images);
        // crear el post
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
        const post = await prisma.post.findFirst(
            {
                where: {
                    user_id: parseInt(userId),
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
                        image: image,
                        index: 0,
                        post_id: post.id,/* provide the post ID here */
                        post_user_id: parseInt(userId),
                    }
                })
        }
        return { success: true }
    } catch (error) {
        return { error: "error 500" }
    }
}

export const updatePost = async (
    values: z.infer<typeof postSchema>,
    image: string,
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
        /*const images = await prisma.image.findMany(
            {
                where: {
                    post_user_id: parseInt(userId),
                    post_id: parseInt(userId)
                }
            }
        )*/
        // const imagesAumont = images.length;
        // console.log("images: ", images);
        // crear el post
        try {
            await prisma.post.update({
                where: { id_user_id: { id: postId, user_id: parseInt(userId) } },
                data: {
                    title: data.title,
                    description: data.description,
                    imagenumber: 0,
                    user_id: parseInt(userId),
                },
            });
        } catch (error) {
            console.error("Error al actualizar el post:", error);
        }

        const post = await prisma.post.findFirst(
            {
                where: {
                    user_id: parseInt(userId),
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
                        image: image,
                        index: 0,
                        post_id: post.id,/* provide the post ID here */
                        post_user_id: parseInt(userId),
                    }
                })
        }
        return { success: true }
    } catch (error) {
        return { error: "error 500" }
    }
}