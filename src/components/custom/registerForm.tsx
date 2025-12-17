
"use client"
/*
import { z } from "zod"
import { signUpSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
//import { signIn } from "next-auth/react"
import { registerAction } from "@/actions/auth-action"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

const RegisterForm = () => {

    const [image, setImage] = useState<File | null>(null) // Estado para la imagen
    const [error, setError] = useState<String | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter();

    // 1. Define your form.
    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
        },
        mode: "onChange",
    });

    // 2. Función para subir la imagen a Cloudinary
    async function uploadImage(file: File) {
        // 1. Obtener la firma desde el backend
        const signatureRes = await fetch("/api/cloudinary-sign");
        const { signature, timestamp, apiKey, cloudName, folder } = await signatureRes.json();

        // 2. Crear el FormData con los datos necesarios
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder); // Agregar la carpeta donde se guardará la imagen

        // 3. Subir la imagen a Cloudinary
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        return data.secure_url; // Devuelve la URL de la imagen subida
    }


    // 3. Define a submit handler.
    async function onSubmit(values: z.infer<typeof signUpSchema>) {

        setError(null);
        startTransition(async () => {
            let imageUrl = null;

            if (image) {
                try {
                    imageUrl = await uploadImage(image);
                } catch (error) {
                    setError("Error al subir la imagen");
                    return;
                }
            }
            const response = await registerAction(values, imageUrl);

            if (response.error) {
                setError(response.error)
            } else {
                router.push("/login?emailsend=true")
            }
        });
    }

    return (
        <div className="w-full">
            <h2>Signup Form</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="email"
                                        type="email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter your email
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="password"
                                        type="password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter your password
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="name"
                                        type="text"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter your name
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />*/
//{/* Nuevo campo para subir la imagen */ }
/*   <FormItem>
       <FormLabel>Profile Picture</FormLabel>
       <FormControl>
           <Input
               type="file"
               accept="image/*"
               onChange={(e) => setImage(e.target.files?.[0] || null)}
           />
       </FormControl>
       <FormMessage />
   </FormItem>
   {error && <FormMessage>{error}</FormMessage>}
   <Button
       type="submit"
       disabled={isPending}
       className="bg-slate-500"
   >
       Submit
   </Button>
</form>
</Form>
</div>
)
}

export default RegisterForm

"use client" */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/lib/zod";
import { registerAction } from "@/actions/auth-action";

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
import Image from "next/image";
import { uploadProfileImage } from "@/lib/cloudinary-functions";

const RegisterForm = () => {
    const [image, setImage] = useState<File | null>(null); // Estado para la imagen
    const [preview, setPreview] = useState<string | null>("/user.jpg"); // Estado para la vista previa
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const inputsCss = "flex items-center rounded h-6";

    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
        },
        mode: "onChange",
    });

    // Función para manejar la selección de la imagen
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImage(file);

        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
        } else {
            setPreview("/user.jpg");
        }
    };

    async function onSubmit(values: z.infer<typeof signUpSchema>) {
        setError(null);
        startTransition(async () => {
            let imageUrl = null;

            if (image) {
                try {
                    imageUrl = await uploadProfileImage(image);
                    const response = await registerAction(values, imageUrl);

                    if (response.error) {
                        setError(response.error);
                    } else {
                        router.push("/login?emailsend=true");
                    }

                } catch (error) {
                    setError("Error al subir la imagen");
                    return;
                }
            }

        });
    }

    return (
        <div className="w-full">

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        className={inputsCss}
                                        placeholder="email"
                                        type="email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Enter your email</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        className={inputsCss}
                                        placeholder="password"
                                        type="password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Enter your password</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl className="">
                                    <Input
                                        className={inputsCss}
                                        placeholder="name"
                                        type="text"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Enter your name</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex flex-row items-center w-full gap-10">
                        {/* Campo para subir la imagen */}
                        <FormItem>
                            <FormLabel
                                className={"flex justify-center items-center rounded w-60 h-12 border-solid border border-green-500 bg-green-200 hover:bg-green-300"}
                            >
                                Subir una imagen de perfil
                            </FormLabel>
                            <FormControl className={"flex  rounded items-center h-6"}>
                                <input
                                    placeholder="Profile Picture"
                                    className={"rounded items-center hidden h-10"}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        {/* Vista previa de la imagen */}
                        {preview && (
                            <div className="mt-2">
                                <p>Vista previa:</p>
                                <div className="w-[96px] aspect-square relative overflow-hidden rounded-full">
                                    <Image
                                        src={preview}
                                        alt="Vista previa de la imagen de perfil"
                                        width={100}
                                        height={100}
                                        className="object-cover rounded-full border-dotted border-2 border-gray-500"
                                    />
                                </div>
                            </div>
                        )}

                    </div>

                    {error && <FormMessage>{error}</FormMessage>}
                    <Button type="submit" disabled={isPending} className="bg-slate-500">
                        Submit
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default RegisterForm;
