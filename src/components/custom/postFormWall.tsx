"use client";

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
import { Textarea } from "../ui/textarea";

import { createPost } from "@/actions/post-action";
import { uploadPostImage } from "@/lib/cloudinary-functions";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useGlobalContext } from "@/context/globalcontext";
import { cfg } from "@/config";
import { ImageIcon, RefreshCcw, X } from "lucide-react";

const PostFormWall = () => {
    const { l } = useGlobalContext();

    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const form = useForm<z.infer<typeof postSchema>>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: "",
            description: "",
        },
        mode: "onChange",
    });

    const titleValue = form.watch("title") ?? "";
    const descValue = form.watch("description") ?? "";

    const TITLE_MAX = 100;
    const DESC_MAX = 1000;

    const counterClass = (len: number, max: number) => {
        if (len > max) return "text-red-400";
        if (len >= Math.floor(max * 0.8)) return "text-yellow-300";
        return "text-slate-400";
    };


    const openFilePicker = () => fileInputRef.current?.click();

    const clearImage = () => {
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        // revocar preview anterior (si era blob)
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);

        setImage(file);

        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        } else {
            setPreview(null);
        }
    };

    // limpieza extra por si el componente se desmonta
    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    async function onSubmit(values: z.infer<typeof postSchema>) {
        setError(null);

        startTransition(async () => {
            let imageUrl: {
                url: string
                publicId: string
            } | null = null;

            if (image) {
                try {
                    imageUrl = (await uploadPostImage(image));
                } catch {
                    setError("Error al subir la imagen");
                    return;
                }
            }

            const response = await createPost(values, imageUrl);

            if (response?.error) {
                setError(response.error);
                return;
            }

            router.push("/");
            window.location.reload();
        });
    }

    return (
        <div id="PostFormWall" className="postFormWall">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel></FormLabel>
                                <FormControl className="postFormWallTitleInput">
                                    <Input placeholder="title" type="text" {...field} />
                                </FormControl>
                                <FormDescription></FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className={`text-[11px] mt-1 ${counterClass(titleValue.length, TITLE_MAX)}`}>
                        {titleValue.length} / {TITLE_MAX}
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel></FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Escribe algo..." {...field} />
                                </FormControl>
                                <FormDescription></FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className={`text-[11px] mt-1 ${counterClass(descValue.length, DESC_MAX)}`}>
                        {descValue.length} / {DESC_MAX}
                    </div>

                    {/* Imagen + botones */}
                    <FormItem>
                        <FormLabel></FormLabel>
                        <FormControl>
                            <div className="flex flex-row items-center justify-center gap-2 h-8">
                                {/* input real (oculto) */}
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                                {!preview ? (
                                    <Button
                                        type="button"
                                        onClick={openFilePicker}
                                        className="bg-slate-500 text-white px-3 py-2 rounded-[8px] h-8 hover:bg-blue-600"
                                    >
                                        <ImageIcon className="mr-2" size={18} />
                                        Seleccionar imagen
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            onClick={openFilePicker}
                                            className="bg-slate-500 text-white px-3 py-2 rounded-[8px] h-8 hover:bg-blue-600"
                                        >
                                            <RefreshCcw className="mr-2" size={18} />
                                            Cambiar imagen
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={clearImage}
                                            className="rounded-[8px] h-8 px-3"
                                        >
                                            <X className="mr-2" size={18} />
                                            Quitar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>

                    {/* Preview */}
                    {preview && (
                        <div className="flex flex-col items-center w-full mt-2">
                            <img
                                src={preview}
                                alt="vista previa"
                                className="w-full max-w-[400px] h-auto rounded-[8px] object-contain"
                            />
                        </div>
                    )}

                    {error && <FormMessage>{error}</FormMessage>}
                    {error && <Link href="/login">{cfg.TEXTS.acceder}</Link>}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-slate-400 hover:bg-slate-300 rounded-[8px]"
                    >
                        Publicar
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default PostFormWall;
