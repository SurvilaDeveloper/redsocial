"use client";

import Image from "next/image";
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import EditPostForm from "./editPostForm";
import { useSession } from "next-auth/react";

/*
interface ImageProps {
    id: number;
    imageUrl: string;
    imagePublicId: string
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
*/
export function PostEdit({ postId }: { postId: number }) {
    const [post, setPost] = useState<Post | null>(null);
    //const [images, setImages] = useState<ImageProps[] | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const session = useSession();
    //const [edit, setEdit] = useState(false);
    console.log("postId en PostEdit:", postId);

    useEffect(() => {
        async function fetchPost() {
            try {
                const res = await fetch(`/api/post?post_id=${postId}`);
                const data = await res.json();

                console.log("data en postEdit: ", data);

                if (data) {
                    setPost(data);
                    //setImages(data.images);
                    // Verificar si el usuario logueado es el dueño del post
                    if (session.data?.user?.id) {
                        setIsOwner(parseInt(session.data.user.id as string) === data.user_id);
                    }
                } else {
                    console.error("No se encontró el post.");
                }
            } catch (error) {
                console.error("Error al obtener el post:", error);
            }
        }

        fetchPost();
    }, [postId, session.data?.user?.id]);

    //const onClickHandle = () => {
    //    setEdit(!edit);
    //};

    if (!post) {
        return <div>Cargando post...</div>;
    }

    return (
        <div className="border p-4 rounded-lg shadow-md w-[700px]">
            {isOwner ? (
                <>
                    <div className="flex justify-between">
                        {/*<Pencil onClick={onClickHandle} />*/}
                    </div>

                    <>
                        {/*<p>{"IMAGENES: " + JSON.stringify(images) + (images ? images.map(img => img.image).join(", ") : "No images available")}</p>*/}
                        <EditPostForm
                            title={post.title}
                            images={post.images && post.images?.length > 0 ? post.images : null}
                            description={post.description}
                            postId={post.id}
                        />
                    </>
                </>
            ) : (
                <>
                    <div>No eres el dueño de este post, no lo puedes editar.</div>
                </>
            )}



        </div>
    );
}

/*

                            imgUrl={images && images?.length > 0 ? images[post.imagenumber].imageUrl : null}
                            imgPublicId={images && images?.length > 0 ? images[post.imagenumber].imagePublicId : null}
                            */