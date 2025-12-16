"use client";

import { useRef, useState, useTransition } from "react";
import { z } from "zod";
import { postSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createPost, updatePost } from "@/actions/post-action";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Image from "next/image";
import { cfg } from "@/config";
import { deletePostImage, uploadPostImage } from "@/lib/cloudinary-functions";

interface ImageProps {
    id: number;
    imageUrl: string;
    imagePublicId: string
    post_id: number;
    post_user_id: number;
    index: number;
}

const EditPostForm = ({
    title,
    //imgUrl,
    //imgPublicId,
    images,
    description,
    postId
}: {
    title: string,
    //imgUrl?: string | null,
    //imgPublicId?: string | null,
    images: ImageProps[] | null,
    description: string,
    postId: number
}) => {

    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null); // Estado para la vista previa

    const [imageSet, setImageSet] = useState<(File | null)[]>(() => {
        const files: (File | null)[] = []; // Tipamos el array correctamente
        if (images) {
            for (let i = 0; i < images.length; i++) {
                if (i !== 0) {
                    files.push(null);
                }
            }
        }
        return files;
    })
    const [previewSet, setPreviewSet] = useState<(string | null)[]>(() => {
        const urls: (string | null)[] = []; // Tipamos el array correctamente
        if (images) {
            for (let i = 0; i < images.length; i++) {
                if (i !== 0) {
                    urls.push(null);
                }
            }
        }
        return urls;
    });
    console.log("previewSet: ", previewSet);
    const [imageToDelete, setImageToDelete] = useState<{ url: string, publicId: string }[]>([])
    const [error, setError] = useState<string | null>(null);
    const imagesAumountRef = useRef<number>(0)
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof postSchema>>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: title,
            description: description,
        },
        mode: "onChange",
    });

    // Función para manejar la selección de imagen
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImage(file);

        // Generar URL temporal para vista previa
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
        } else {
            setPreview(null);
        }
    };

    // Función para manejar la selección de imagen accesoria
    const handleAddedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageSet((prev) => [...prev, file]); // Copia el array y agrega el nuevo archivo
            const objectUrl = URL.createObjectURL(file);
            setPreviewSet((prev) => [...prev, objectUrl]); // Copia el array y agrega la nueva URL
        }
    };

    async function onSubmit(values: z.infer<typeof postSchema>) {
        setError(null);
        startTransition(async () => {
            let imageUrl = null;
            let imageAddedUrls: ({ url: string, publicId: string } | null)[] = []

            if (image) {
                try {
                    imageUrl = await uploadPostImage(image); // guarda en cloudinary
                } catch (error) {
                    setError("Error al subir la imagen");
                    return;
                }
            }
            if (imageSet.length > 0) {
                try {
                    for (let i = 0; i < imageSet.length; i++) {
                        if (imageSet[i] != null) {
                            const imageUrl = await uploadPostImage(imageSet[i] as File) // guarda en cloudinary
                            imageAddedUrls.push(imageUrl)
                        } else {
                            imageAddedUrls.push(null)
                        }
                    }
                } catch (error) {
                    setError("Error al subir las imagenes accesorias");
                    return;
                }
            }

            if (imageToDelete.length > 0) {
                for (let i = 0; i < imageToDelete.length; i++) {
                    const res = await deletePostImage(imageToDelete[i])
                    console.log("respuesta en editPostForm: ", res);
                }
            }

            const response = await updatePost(values, imageUrl, imageAddedUrls, imageToDelete, postId); // guarda en db

            if (response.error) {
                setError(response.error);
                console.log("Error en la creación del post: ", response.error);
            } else {
                router.push("/");
            }
        });
    }

    function removeImageAdded(index: number) {
        // Revocamos la URL creada para liberar memoria
        if (previewSet[index]) {
            URL.revokeObjectURL(previewSet[index]);
        }
        // Eliminamos la imagen del estado
        // Crear copias del estado antes de modificarlos
        setImageSet((prev) => {
            const newImages = [...prev]; // Copia del array
            newImages[index] = null; // Modificación segura
            return newImages;
        });

        setPreviewSet((prev) => {
            const newPreviews = [...prev]; // Copia del array
            newPreviews[index] = null; // Modificación segura
            return newPreviews;
        });
    }

    function changeImageAdded(e: React.ChangeEvent<HTMLInputElement>, index: number) {
        // Revocamos la URL creada para liberar memoria
        if (previewSet[index]) {
            URL.revokeObjectURL(previewSet[index]);
        }

        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);

            // Crear copias del estado antes de modificarlos
            setImageSet((prev) => {
                const newImages = [...prev]; // Copia del array
                newImages[index] = file; // Modificación segura
                return newImages;
            });

            setPreviewSet((prev) => {
                const newPreviews = [...prev]; // Copia del array
                newPreviews[index] = objectUrl; // Modificación segura
                return newPreviews;
            });
        }
    }

    function removeSavedImageAdded(e: React.MouseEvent<HTMLButtonElement>, img: { url: string, publicId: string }) {
        e.preventDefault(); // Evita el envío del formulario
        console.log(img);
        setImageToDelete((prev) => {
            const array = [...prev]
            array.push(img)
            return array
        })

    }

    console.log("imageToDelete: ", imageToDelete);
    return (
        <div className="flex flex-col items-center w-full bg-slate-100">

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">Title</FormLabel>
                                <FormControl>
                                    <Input placeholder={title} type="text" {...field} />
                                </FormControl>
                                <div className="flex flex-row justify-between gap-8">
                                    <FormDescription>Enter your title</FormDescription>
                                    <FormMessage className="bg-red-200 text-red-700 font-bold px-2" />
                                </div>

                            </FormItem>
                        )}
                    />
                    {/* Campo para subir la imagen */}
                    <FormItem>
                        <FormLabel className="flex items-center px-4 bg-green-300 h-12 w-fit rounded-[6px] hover:bg-green-200 transition">
                            Cambia la imagen
                        </FormLabel>

                        <FormControl>
                            <Input

                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />

                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-400 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition">

                        {images && images.length > 0 ? (
                            <>
                                {preview ? (
                                    <Image src={preview} alt="Vista previa actual" width={512} height={512}></Image>
                                ) : (
                                    <Image src={images[0].imageUrl} alt="Vista previa editando" width={512} height={512}></Image>
                                )}
                            </ >
                        ) : (
                            <>
                                {preview ? (
                                    <Image src={preview} alt="Vista previa actual" width={512} height={512}></Image>
                                ) : (
                                    <Image src="/imageneutral.jpg" alt="Vista previa editando" width={512} height={512} className="w-auto h-auto"></Image>
                                )}
                            </ >
                        )}

                    </div>


                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">Description</FormLabel>
                                <FormControl>
                                    <textarea
                                        {...field}
                                        placeholder="Enter your description"
                                        className="w-full h-32 border border-solid border-black rounded-[6px] p-2"
                                    />
                                </FormControl>
                                <div className="flex flex-row justify-between gap-8">
                                    <FormDescription>Enter your description</FormDescription>
                                    <FormMessage className="bg-red-200 text-red-700 font-bold px-2" />
                                </div>
                            </FormItem>
                        )}
                    />
                    {/* Campo para subir imagen accesoria imagen */}
                    {imagesAumountRef.current = 0}

                    {previewSet.map((val, index) => {

                        if (val) {
                            imagesAumountRef.current = imagesAumountRef.current + 1;
                            return (

                                <div key={val} className="flex flex-col gap-2">
                                    <hr className="border-blue-500"></hr>
                                    {/* Campo para subir la imagen */}
                                    <div className="flex flex-row gap-2">
                                        <FormItem>
                                            <FormLabel className="flex items-center px-4 bg-green-300 h-8 w-fit rounded-[6px] hover:bg-green-200 transition">
                                                Cambia la imagen (preview)
                                            </FormLabel>
                                            <FormControl>
                                                <Input

                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => { changeImageAdded(e, index) }}
                                                    className="hidden"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        <Button
                                            className="flex items-center px-4 bg-red-300 h-8 w-fit rounded-[6px] hover:bg-red-200 transition"
                                            onClick={() => { imagesAumountRef.current--; removeImageAdded(index) }}>
                                            {
                                                images && images.length - 1 > index
                                                    ?
                                                    "Volver a la imagen original"
                                                    :
                                                    "Eliminar la imagen agregada"
                                            }
                                        </Button>
                                    </div>
                                    <Image src={val} alt="imagen accesoria" width={512} height={512} />

                                </div>
                            )
                        } else if (images && images[index + 1] && !imageToDelete.some((obj) => images[index + 1].imageUrl === obj.url)) {
                            imagesAumountRef.current = imagesAumountRef.current + 1;
                            return (
                                <div key={images[index + 1].imageUrl} className="flex flex-col gap-2">
                                    <hr className="border-blue-500"></hr>
                                    {/* Campo para subir la imagen */}
                                    <div className="flex flex-row gap-2">
                                        <FormItem>
                                            <FormLabel className="flex items-center px-4 bg-green-300 h-8 w-fit rounded-[6px] hover:bg-green-200 transition">
                                                Cambia la imagen
                                            </FormLabel>
                                            <FormControl>
                                                <Input

                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => { changeImageAdded(e, index) }}
                                                    className="hidden"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        <Button
                                            className="flex items-center px-4 bg-red-300 h-8 w-fit rounded-[6px] hover:bg-red-200 transition"
                                            onClick={(e) => { imagesAumountRef.current--; removeSavedImageAdded(e, { url: images[index + 1].imageUrl, publicId: images[index + 1].imagePublicId }) }}>
                                            Eliminar
                                        </Button>

                                    </div>
                                    <Image src={images[index + 1].imageUrl} alt="imagen accesoria" width={512} height={512} />

                                </div>
                            )
                        }

                    })}

                    {imagesAumountRef.current < 6 ? (

                        <FormItem>
                            <FormLabel className="flex items-center px-4 bg-green-300 h-12 w-fit rounded-[6px] hover:bg-green-200 transition">
                                Agrega una imagen más al post : {imagesAumountRef.current}
                            </FormLabel>

                            <FormControl>
                                <Input

                                    type="file"
                                    accept="image/*"
                                    onChange={handleAddedImageChange}
                                    className="hidden"
                                />

                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    ) : (
                        <div className="text-orange-800">El límite para la cantidad de imágenes accesorias es de 6</div>
                    )}



                    {error && <FormMessage>{error}</FormMessage>}
                    {error && <Link href="/login">{cfg.TEXTS.acceder}</Link>}

                    <Button type="submit" disabled={isPending} className="rounded-[6px] bg-green-300 hover:bg-green-200">
                        Guardar los cambios y salir
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default EditPostForm;
