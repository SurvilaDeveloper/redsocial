import { object, string } from "zod"

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
    title: string().min(1, "El título es obligatorio").max(100, "Máximo 100 caracteres"),
    description: string().max(1000, "Máximo 1000 caracteres"),
});