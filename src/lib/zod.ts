import { date, datetimeRegex, object, string } from "zod"
import z from "zod";

export const loginSchema = object({
    email: string({ required_error: "Email is required" })
        .min(1, "Email is required")
        .email("Invalid email"),
    password: string({ required_error: "Password is required" })
        .min(1, "Password is required")
        .min(4, "Password must be more than 4 characters")
        .max(32, "Password must be less than 32 characters"),
})

export const signUpSchema = object({
    email: string({ required_error: "Email is required" })
        .min(1, "Email is required")
        .email("Invalid email"),
    password: string({ required_error: "Password is required" })
        .min(1, "Password is required")
        .min(4, "Password must be more than 4 characters")
        .max(32, "Password must be less than 32 characters"),
    name: string({ required_error: "Username is required" })
        .min(1, "Name is required")
        .max(32, "Name must be less than 32 characters"),
})

export const postSchema = object({
    title: string().max(100, "Máximo 100 caracteres"),
    description: string().min(3, "El post debe tener entre 3 y 1000 caracteres").max(1000, "Máximo 1000 caracteres"),
});


export const profileSchema = object({
    nick: string().max(32, "Máximo 32 caracteres").optional().or(z.literal("")),
    bio: string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
    phoneNumber: string()
        .regex(/^\d{7,15}$/, "Número de teléfono inválido")
        .optional()
        .or(z.literal("")),
    movilNumber: string()
        .regex(/^\d{7,15}$/, "Número de teléfono inválido")
        .optional()
        .or(z.literal("")),
    birthday: z
        .preprocess((arg) => (typeof arg === "string" && arg !== "" ? new Date(arg) : arg), z.date().optional()),
    website: string().url("URL inválida").optional().or(z.literal("")),
    occupation: string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
    company: string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
    twitterHandle: string()
        .regex(/^@([A-Za-z0-9_]{1,15})$/, "El handle de Twitter debe empezar con '@' y contener solo letras, números y guiones bajos.")
        .optional()
        .or(z.literal("")),
    facebookHandle: string()
        .regex(/^(https?:\/\/)?(www\.)?facebook\.com\/[A-Za-z0-9.]{5,}$/, "El enlace de Facebook debe ser válido.")
        .optional()
        .or(z.literal("")),
    instagramHandle: string()
        .regex(/^(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9_.]{1,30}$/, "El enlace de Instagram debe ser válido.")
        .optional()
        .or(z.literal("")),
    linkedinHandle: string()
        .regex(/^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-]{3,50}$/, "El enlace de LinkedIn debe ser válido.")
        .optional()
        .or(z.literal("")),
    githubHandle: string()
        .regex(/^https:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+$/, "El enlace de GitHub debe ser válido.")
        .optional()
        .or(z.literal("")),
    youtubeHandle: string()
        .regex(
            /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|channel\/|c\/|user\/)|youtu\.be\/)[A-Za-z0-9_-]+\/?$/,
            "El enlace de YouTube debe ser válido (video o canal)."
        )
        .optional()
        .or(z.literal("")),
    country: string().max(127, "Máximo 127 caracteres").optional().or(z.literal("")),
    province: string().max(127, "Máximo 127 caracteres").optional().or(z.literal("")),
    city: string().max(127, "Máximo 127 caracteres").optional().or(z.literal("")),
    street: string().max(127, "Máximo 127 caracteres").optional().or(z.literal("")),
    number: string().max(7, "Máximo 7 caracteres").optional().or(z.literal("")),
    department: string().max(7, "Máximo 7 caracteres").optional().or(z.literal("")),
    mailCode: string()
        .regex(/^[A-Za-z0-9\s-]{3,10}$/, "Código postal inválido")
        .optional()
        .or(z.literal("")),

});





