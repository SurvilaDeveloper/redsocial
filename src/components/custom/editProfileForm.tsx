"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/lib/zod"; // Asegúrate de importar tu esquema correctamente
//import { Input, Label, Button, Form, FormField, FormItem, FormControl, FormMessage } from "@shadcn/ui"; // Asumiendo que tienes estos componentes de ShadCN
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Phone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link";
import countries from "@/lib/countries";
import { Earth } from "lucide-react";


// Componente del formulario de perfil
const ProfileForm = ({
    user
}: {
    user: {
        nick: string,
        bio: string,
        phoneNumber: string,
        movilNumber: string,
        birthday: Date,
        occupation: string,
        company: string,
        twitterHandle: string,
        facebookHandle: string,
        instagramHandle: string,
        linkedinHandle: string,
        githubHandle: string,
        youtubeHandle: string,
        country: string,
        province: string,
        city: string,
        street: string,
        number: string,
        department: string,
        mailCode: string,

    }
}
) => {
    const [preview, setPreview] = useState<string | null>("/user.jpg"); // Estado para la vista previa
    const [wallPreview, setWallPreview] = useState<string | null>("/wall.jpg");
    const [discardAsk, setDiscardAsk] = useState(false);
    const [page, setPage] = useState("personal") // personal, behavior, configuration, validation


    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            nick: user.nick || "",
            bio: user.bio || "",
            phoneNumber: user.phoneNumber || "",
            movilNumber: user.movilNumber || "",
            birthday: user.birthday || undefined,
            occupation: user.occupation || "",
            company: user.company || "",
            twitterHandle: user.twitterHandle || "",
            facebookHandle: user.facebookHandle || "",
            instagramHandle: user.instagramHandle || "",
            linkedinHandle: user.linkedinHandle || "",
            githubHandle: user.githubHandle || "",
            youtubeHandle: user.youtubeHandle || "",
            country: user.country || "",
            province: user.province || "",
            city: user.city || "",
            street: user.street || "",
            number: user.number || "",
            department: user.department || "",
            mailCode: user.mailCode || "",

        },
        mode: "onChange",
    });

    const onSubmit = (data: any) => {
        console.log("Form data", data);
    };

    const discardChangesAndExit = () => {
        discardAsk ? setDiscardAsk(false) : setDiscardAsk(true)
    }

    const personal = () => {
        setPage("personal")
    }

    const location = () => {
        setPage("location")
    }

    const behavior = () => {
        setPage("behavior")
    }

    const configuration = () => {
        setPage("configuration")
    }

    const validation = () => {
        setPage("validation")
    }

    return (
        <div className="flex flex-col">
            <div className="flex flex-row justify-stretch" id="flaps">
                <Button onClick={personal} className="border border-black w-full rounded-t-[6px]">Datos personales</Button>
                <Button onClick={location} className="border border-black w-full rounded-t-[6px]">Ubicación</Button>
                <Button onClick={behavior} className="border border-black w-full rounded-t-[6px]">Conducta</Button>
                <Button onClick={configuration} className="border border-black w-full rounded-t-[6px]">Configuración</Button>
                <Button onClick={validation} className="border border-black w-full rounded-t-[6px]">Validación de cuenta</Button>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="">

                    {page === "personal" &&
                        <div className="border border-black px-2 w-[768px]">

                            {/* Campo para subir la imagen del muro*/}
                            <div className="flex flex-col items-center w-full gap-6">
                                {/* Vista previa de la imagen del muro*/}
                                {preview && (
                                    <div className="mt-2">

                                        {wallPreview &&
                                            <Image
                                                src={wallPreview}
                                                alt="Vista previa de la imagen del muro"
                                                width={768}
                                                height={256}
                                                className="object-cover border-dotted border-2 border-gray-500 w-[768px] h-[256px]"
                                            />
                                        }

                                        <FormItem>
                                            <FormLabel
                                                className={"flex justify-center items-center rounded-full w-auto px-4 mx-4 h-12 border-solid border border-green-500 bg-green-200 hover:bg-green-300 absolute top-56"}
                                            >
                                                Elegir la imagen del muro
                                            </FormLabel>
                                            <FormControl className={"flex  rounded items-center h-6"}>
                                                <input
                                                    placeholder="Profile Picture"
                                                    className={"rounded items-center hidden h-10"}
                                                    type="file"
                                                    accept="image/*"
                                                //onChange={handleImageChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    </div>
                                )}


                            </div>
                            {/* Campo para subir la imagen */}
                            <div className="flex flex-row items-center justify-center w-full gap-10">
                                <FormItem>
                                    <FormLabel
                                        className={"flex justify-center items-center rounded w-60 h-12 border-solid border border-green-500 bg-green-200 hover:bg-green-300"}
                                    >
                                        Cambiar la imagen de perfil
                                    </FormLabel>
                                    <FormControl className={"flex  rounded items-center h-6"}>
                                        <input
                                            placeholder="Profile Picture"
                                            className={"rounded items-center hidden h-10"}
                                            type="file"
                                            accept="image/*"
                                        //onChange={handleImageChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                {/* Vista previa de la imagen */}
                                {preview && (
                                    <div className="mt-2">

                                        <Image
                                            src={preview}
                                            alt="Vista previa de la imagen de perfil"
                                            width={100}
                                            height={100}
                                            className="object-cover rounded-full border-dotted border-2 mb-4 border-gray-500"
                                        />
                                    </div>
                                )}
                            </div>
                            <hr className="mb-4 border-black"></hr>

                            {/* Nick */}
                            <FormField
                                control={form.control}
                                name="nick"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="nick">Pseudónimo</Label>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="nick"
                                                    placeholder="Ingresa tu Nick"
                                                />
                                            </FormControl>

                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>
                            {/* Bio */}
                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label htmlFor="bio">Texto de presentación</Label>
                                        <FormControl>
                                            <Textarea
                                                className="h-8 rounded-[4px] border-gray-500 bg-slate-100"
                                                {...field} id="bio"
                                                placeholder="Cuéntanos algo sobre ti" />
                                        </FormControl>
                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>

                            {/* Occupation */}
                            <FormField
                                control={form.control}
                                name="occupation"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="occupation">Ocupación</Label>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="occupation"
                                                    placeholder="¿Cúál es tu ocupación?"
                                                />
                                            </FormControl>

                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>

                            {/* company */}
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="company">Companía</Label>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="company"
                                                    placeholder="A qué companía perteneces"
                                                />
                                            </FormControl>

                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>

                            {/* Phone Number */}
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="phoneNumber">Número de teléfono fijo</Label>
                                            <Phone className="w-[24px] h-[24px]"></Phone>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="phoneNumber"
                                                    placeholder="Número de teléfono"
                                                />
                                            </FormControl>
                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>

                            {/* Movil Phone Number */}
                            <FormField
                                control={form.control}
                                name="movilNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="movilNumber">Número de teléfono móvil</Label>
                                            <Image src="/whatsapp.svg" alt="whatsapplogo" width={24} height={24}></Image>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="movilNumber"
                                                    placeholder="Número de teléfono móvil"
                                                />
                                            </FormControl>
                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>
                            {/* Birthday */}


                            {/* Birthday datepicker */}

                            <FormField
                                control={form.control}
                                name="birthday"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <div className="flex flex-row gap-4 items-center">
                                            <FormLabel>Fecha de nacimiento</FormLabel>
                                            <Popover >
                                                <PopoverTrigger asChild className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500">
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-[240px] pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-white rounded-[6px]" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                // Mantiene el mes y año actuales al seleccionar un día
                                                                const currentDate = field.value || new Date();
                                                                field.onChange(new Date(currentDate.getFullYear(), currentDate.getMonth(), date.getDate()));
                                                            }
                                                        }}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                        components={{
                                                            Caption: ({ displayMonth }) => {
                                                                const selectedDate = field.value || displayMonth;
                                                                const currentYear = selectedDate?.getFullYear() ?? new Date().getFullYear();
                                                                const currentMonth = selectedDate?.getMonth() ?? new Date().getMonth();

                                                                return (
                                                                    <div className="flex gap-2 items-center justify-center">
                                                                        {/* Selector de Mes */}
                                                                        <select
                                                                            value={currentMonth}
                                                                            onChange={(e) =>
                                                                                field.onChange(new Date(currentYear, Number(e.target.value), field.value?.getDate() || 1))
                                                                            }
                                                                            className="border rounded px-2 py-1"
                                                                        >
                                                                            {[
                                                                                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                                                                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                                                                            ].map((month, index) => (
                                                                                <option key={index} value={index}>
                                                                                    {month}
                                                                                </option>
                                                                            ))}
                                                                        </select>

                                                                        {/* Selector de Año */}
                                                                        <select
                                                                            value={currentYear}
                                                                            onChange={(e) =>
                                                                                field.onChange(new Date(Number(e.target.value), currentMonth, field.value?.getDate() || 1))
                                                                            }
                                                                            className="border rounded px-2 py-1"
                                                                        >
                                                                            {Array.from({ length: 125 }, (_, i) => 1900 + i).map((year) => (
                                                                                <option key={year} value={year}>
                                                                                    {year}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                );
                                                            },
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <FormDescription className="text-gray-500">
                                            Your date of birth is used to calculate your age.
                                        </FormDescription>
                                        <FormMessage className="text-red-700" />
                                    </FormItem>
                                )}
                            />
                            <hr className="my-4 border-black"></hr>


                            {/* Twitter */}
                            <FormField
                                control={form.control}
                                name="twitterHandle"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Image src="/x.svg" alt="xlogo" width={24} height={24}></Image>
                                            <Label
                                                className="w-20"
                                                htmlFor="twitterHandle">Twitter</Label>
                                            <FormControl>
                                                <Input
                                                    className="w-[500px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="twitterHandle"
                                                    placeholder="Enlace de Twitter"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="my-4 border-black"></hr>

                            {/* Facebook */}
                            <FormField
                                control={form.control}
                                name="facebookHandle"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Image src="/facebook.svg" alt="facebooklogo" width={24} height={24}></Image>
                                            <Label
                                                className="w-20"
                                                htmlFor="facebookHandle">Facebook</Label>
                                            <FormControl>
                                                <Input className="w-[500px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="facebookHandle"
                                                    placeholder="Enlace de Facebook"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="my-4 border-black"></hr>

                            {/* Youtube */}
                            <FormField
                                control={form.control}
                                name="youtubeHandle"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Image src="/youtube.svg" alt="youtubelogo" width={24} height={24}></Image>
                                            <Label
                                                className="w-20"
                                                htmlFor="linkedinHandle">Youtube</Label>
                                            <FormControl>
                                                <Input className="w-[500px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="linkedinHandle"
                                                    placeholder="Enlace de Youtube"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="my-4 border-black"></hr>

                            {/* Instagram */}
                            <FormField
                                control={form.control}
                                name="instagramHandle"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Image src="/instagram.svg" alt="instagramlogo" width={24} height={24}></Image>
                                            <Label
                                                className="w-20"
                                                htmlFor="instagramHandle">Instagram</Label>
                                            <FormControl>
                                                <Input className="w-[500px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="instagramHandle"
                                                    placeholder="Enlace de Instagram"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="my-4 border-black"></hr>

                            {/* LinkedIn */}
                            <FormField
                                control={form.control}
                                name="linkedinHandle"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Image src="/linkedin.svg" alt="linkedinlogo" width={24} height={24}></Image>
                                            <Label
                                                className="w-20"
                                                htmlFor="linkedinHandle">LinkedIn</Label>
                                            <FormControl>
                                                <Input className="w-[500px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="linkedinHandle"
                                                    placeholder="Enlace de LinkedIn"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="my-4 border-black"></hr>

                            {/* GitHub */}
                            <FormField
                                control={form.control}
                                name="githubHandle"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Image src="/github.svg" alt="githublogo" width={24} height={24}></Image>
                                            <Label
                                                className="w-20"
                                                htmlFor="githubHandle">GitHub</Label>
                                            <FormControl>
                                                <Input className="w-[500px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="githubHandle"
                                                    placeholder="Enlace de GitHub"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />

                        </div>
                    }
                    {page === "location" &&
                        <div className="border border-black px-2 w-[768px]">pagina de ubicación
                            {/*  país */}
                            <FormField control={form.control} name="country" render={({ field }) => (
                                <FormItem>
                                    <div className="flex flex-row gap-4 items-center py-6">
                                        <Earth width={24} height={24} />
                                        <FormLabel className="w-20" htmlFor="country">País</FormLabel>
                                        <FormControl>
                                            <Select {...field} onValueChange={field.onChange}>
                                                <SelectTrigger className="w-[200px] bg-white rounded-[6px] h-8">
                                                    <SelectValue placeholder="Seleccione un país" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    {countries.map((country) => (
                                                        <SelectItem key={country.country} value={country.country}>
                                                            {country.country}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </div>
                                    <FormMessage className="text-red-700" />
                                </FormItem>
                            )} />
                            {/* Province */}
                            <FormField
                                control={form.control}
                                name="province"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">

                                            <Label
                                                className="w-20"
                                                htmlFor="province">Provincia</Label>
                                            <FormControl>
                                                <Input className="w-[500px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="province"
                                                    placeholder="Ingrese su provincia o estado"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            {/* city */}
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="city">Ciudad</Label>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="city"
                                                    placeholder="Tu ciudad"
                                                />
                                            </FormControl>

                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>

                            {/* street */}
                            <FormField
                                control={form.control}
                                name="street"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="street">Calle</Label>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="street"
                                                    placeholder="Tu calle"
                                                />
                                            </FormControl>

                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>

                            {/* number */}
                            <FormField
                                control={form.control}
                                name="number"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="number">Número</Label>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="number"
                                                    placeholder="Número de domicilio"
                                                />
                                            </FormControl>

                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>

                            {/* department */}
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="department">Departamento</Label>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="department"
                                                    placeholder="Si es departamento, cuál?"
                                                />
                                            </FormControl>

                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                            <hr className="mb-4 border-black"></hr>

                            {/* mailCode */}
                            <FormField
                                control={form.control}
                                name="mailCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex flex-row gap-4 items-center">
                                            <Label htmlFor="mailCode">Código postal</Label>
                                            <FormControl>
                                                <Input
                                                    className="w-[280px] h-8 rounded-[4px] bg-slate-100 border-gray-500"
                                                    {...field}
                                                    id="mailCode"
                                                    placeholder="Tu código postal"
                                                />
                                            </FormControl>

                                        </div>

                                        <FormMessage className="text-red-700">.</FormMessage>
                                    </FormItem>
                                )}
                            />
                        </div>
                    }
                    {page === "behavior" &&
                        <div className="border border-black px-2 w-[768px]">pagina conducta</div>
                    }
                    {page === "configuration" &&
                        <div className="border border-black px-2 w-[768px]">pagina configuración</div>
                    }
                    {page === "validation" &&
                        <div className="border border-black px-2 w-[768px]">pagina validation</div>
                    }


                    <div className="flex flex-row gap-10">
                        {/* Submit button */}
                        <Button type="submit" className="flex justify-center items-center rounded w-60 h-12 border-solid border border-green-500 bg-green-200 hover:bg-green-300">
                            Guardar los cambios y salir
                        </Button>
                        {/* discard and exit */}
                        <Button
                            type="button"
                            onClick={discardChangesAndExit}
                            className="flex justify-center items-center rounded w-60 h-12 border-solid border border-green-500 bg-green-200 hover:bg-green-300">
                            Descartar cambios y salir
                        </Button>
                        {discardAsk ? <div className="flex flex-col fixed left-96 bottom-10 bg-yellow-100 p-4 gap-4 rounded-[8px]">
                            <p>Are you sure you want to discard changes and exit?</p>
                            <div className="flex flex-row justify-between">
                                <Link href="/" className="flex flex-row items-center bg-green-400 rounded hover:bg-green-300 px-2">Yes</ Link>
                                <Button onClick={discardChangesAndExit} className="bg-red-400 rounded hover:bg-red-300">No, I do NOT want</Button>
                            </div>
                        </div> : <></>}
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default ProfileForm;



