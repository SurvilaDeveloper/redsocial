"use client";

import Image from "next/image";
import { Pencil } from "lucide-react";
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

export function PostEdit({ postId }: { postId: number }) {
    const [post, setPost] = useState<PostProps | null>(null);
    const [images, setImages] = useState<ImageProps[] | null>(null);
    //const [edit, setEdit] = useState(false);

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

    //const onClickHandle = () => {
    //    setEdit(!edit);
    //};

    if (!post) {
        return <div>Cargando post...</div>;
    }

    return (
        <div className="border p-4 rounded-lg shadow-md w-full">
            <div className="flex justify-between">
                {/*<Pencil onClick={onClickHandle} />*/}
            </div>



            <>
                <p>{"IMAGENES: " + (images ? images.map(img => img.image).join(", ") : "No images available")}</p>
                <EditPostForm
                    title={post.title}
                    imgUrl={images ? images[post.imagenumber].image : null}
                    description={post.description}
                    postId={post.id}
                />
            </>


        </div>
    );
}