"use client";

import Image from "next/image";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import EditPostForm from "./editPostForm";


interface ImageProps {
    id: number;
    image: string;
    post_id: number;
    post_user_id: number;
    index: number;
}

interface PostProps {
    id: number;
    title: string;
    description: string;
    imagenumber: number;
    createdAt: string;
    images: ImageProps[];
}

export function Post({ postId }: { postId: number }) {
    const [post, setPost] = useState<PostProps | null>(null);
    const [images, setImages] = useState<ImageProps[] | null>(null);
    const [edit, setEdit] = useState(false);

    useEffect(() => {
        async function fetchPost() {
            try {
                const res = await fetch(`/api/post?post_id=${postId}`);
                const data = await res.json();

                if (data.post) {
                    setPost(data.post);
                    setImages(data.images);
                } else {
                    console.error("No se encontró el post.");
                }
            } catch (error) {
                console.error("Error al obtener el post:", error);
            }
        }

        fetchPost();
    }, [postId]);

    const onClickHandle = () => {
        setEdit(!edit);
    };

    if (!post) {
        return <div>Cargando post...</div>;
    }

    return (
        <div className="border p-4 rounded-lg shadow-md w-full">
            <div className="flex justify-between">
                <Link href={`/editpost?post_id=${post.id}`} >
                    <Pencil />
                </ Link>

            </div>
            {/*!edit && (*/
                <>
                    <h3 className="text-lg font-semibold mt-2">{post.title}</h3>
                    <p className="text-gray-600 w-[600px]">{post.description}</p>
                    <p>{JSON.stringify(post)}</p>
                    <Image src={images ? images[post.imagenumber].image : "no imagen disponible"} alt="imagen de muestra" width={600} height={600}></Image>
                </>
            /*)*/}

            {/*edit && (
                <>
                    <p>{"IMAGENES: " + (images ? images.map(img => img.image).join(", ") : "No images available")}</p>
                    <EditPostForm
                        title={post.title}
                        imgUrl={images ? images[0].image : null}
                        description={post.description}
                        postId={post.id}
                    />
                </>

            )*/}
        </div>
    );
}
