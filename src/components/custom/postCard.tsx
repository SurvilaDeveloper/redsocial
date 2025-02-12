import Image from "next/image";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Key } from "react";
import EditPostForm from "./editPostForm";
import { parse } from "path";


export function PostCard({ post }: { post: { title: string; description: string; image?: string; id: number; images?: { image: string, index: number, post_user_id: number, post_id: number, id: number }[] } }) {
    console.log("post.images en PostCard: ", post.images);

    return (
        <div className="border p-4 rounded-lg shadow-md w-full">



            {/*post.image && <img src={post.image} alt={post.title} className="w-full h-40 object-cover rounded-md" />*/}

            <h3 className="text-lg font-semibold mt-2">{post.title}</h3>

            {/*post.image && <Image src={post.image} alt={post.title} width={600} height={600}></Image>*/}
            <p className="text-gray-600 w-[600px]">{post.description}</p>


            {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">

                    {post.images.map((img, index) =>
                        img ? (
                            <Link
                                key={
                                    parseInt(img.post_user_id.toString() +
                                        img.post_id.toString() +
                                        img.id.toString() +
                                        img.index.toString()
                                        + index.toString()
                                    )
                                }
                                href={`/showpost?post_id=${img.post_id}`}>
                                <Image
                                    src={img.image}
                                    alt={`Imagen ${index}`}
                                    width={600}
                                    height={600}
                                />
                                <p>index: {img.index}</p>
                            </Link>

                        ) : null
                    )}
                </div>
            )}


        </div>
    );
}
