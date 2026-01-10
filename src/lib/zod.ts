// src/lib/zod.ts
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                   AUTH                                     */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .min(1, "Email is required")
        .email("Invalid email"),

    password: z
        .string({ required_error: "Password is required" })
        .min(1, "Password is required")
        .min(4, "Password must be more than 4 characters")
        .max(32, "Password must be less than 32 characters"),
});

export const signUpSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .min(1, "Email is required")
        .email("Invalid email"),

    password: z
        .string({ required_error: "Password is required" })
        .min(1, "Password is required")
        .min(4, "Password must be more than 4 characters")
        .max(32, "Password must be less than 32 characters"),

    name: z
        .string({ required_error: "Username is required" })
        .min(1, "Name is required")
        .max(32, "Name must be less than 32 characters"),
});

/* -------------------------------------------------------------------------- */
/*                                   POSTS                                    */
/* -------------------------------------------------------------------------- */

export const postSchema = z.object({
    title: z
        .string()
        .max(100, "Máximo 100 caracteres"),

    description: z
        .string()
        .min(3, "El post debe tener entre 3 y 1000 caracteres")
        .max(1000, "Máximo 1000 caracteres"),
});

/* -------------------------------------------------------------------------- */
/*                              SHARED HELPERS                                */
/* -------------------------------------------------------------------------- */

// string | null | undefined
// trim + max + convierte "" → null
const optNullableTrimmed = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .nullable()
        .transform((v) => (v == null || v === "" ? null : v));

// teléfono genérico
const optNullablePhone = () =>
    z
        .string()
        .trim()
        .max(30)
        .optional()
        .nullable()
        .transform((v) => (v == null || v === "" ? null : v));

/* -------------------------------------------------------------------------- */
/*                                  PROFILE                                   */
/* -------------------------------------------------------------------------- */

export const profileSchema = z.object({
    nick: optNullableTrimmed(50).refine(
        (v) => v == null || v.length >= 2,
        "El nick debe tener al menos 2 caracteres"
    ),

    bio: optNullableTrimmed(500),

    phoneNumber: optNullablePhone(),
    movilNumber: optNullablePhone(),

    // string datetime (ISO) | null | undefined
    birthday: z.union([z.string().datetime(), z.null()]).optional(),

    visibility: z.number().int().min(0).max(2).optional(),

    darkModeEnabled: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),

    country: optNullableTrimmed(100),
    province: optNullableTrimmed(100),
    city: optNullableTrimmed(100),

    countryId: z.number().int().positive().nullable().optional(),
    provinceId: z.number().int().positive().nullable().optional(),
    cityId: z.number().int().positive().nullable().optional(),

    street: optNullableTrimmed(127),
    number: optNullableTrimmed(7),
    department: optNullableTrimmed(7),
    mail_code: optNullableTrimmed(10),

    website: optNullableTrimmed(127),

    language: optNullableTrimmed(3),
    occupation: optNullableTrimmed(100),
    company: optNullableTrimmed(100),

    twitterHandle: optNullableTrimmed(100),
    facebookHandle: optNullableTrimmed(100),
    instagramHandle: optNullableTrimmed(100),
    linkedinHandle: optNullableTrimmed(100),
    githubHandle: optNullableTrimmed(100),
});

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type ProfileFormValues = z.infer<typeof profileSchema>;

/* -------------------------------------------------------------------------- */
/*                                   CONFIGURATION                            */
/* -------------------------------------------------------------------------- */


export const configurationSchema = z.object({
    profileImageVisibility: z.number().int().min(1).max(4),
    coverImageVisibility: z.number().int().min(1).max(4),
    fullProfileVisibility: z.number().int().min(1).max(4),

    wallVisibility: z.number().int().min(1).max(4),
    postsVisibility: z.number().int().min(1).max(4),
    postCommentsVisibility: z.number().int().min(1).max(4),
    postRepliesVisibility: z.number().int().min(1).max(4),

    mediaVisibility: z.number().int().min(1).max(4),
    mediaCommentsVisibility: z.number().int().min(1).max(4),
    mediaRepliesVisibility: z.number().int().min(1).max(4),

    friendsListVisibility: z.number().int().min(2).max(4),
    followersListVisibility: z.number().int().min(1).max(4),
    followingListVisibility: z.number().int().min(1).max(4),

    likesVisibility: z.number().int().min(1).max(4),
    privateMessagesVisibility: z.number().int().min(2).max(4),
})

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "La contraseña actual es obligatoria"),

        newPassword: z
            .string()
            .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),

        confirmPassword: z.string(),
    })
    .refine(
        (data) => data.newPassword !== data.currentPassword,
        {
            path: ["newPassword"],
            message: "La nueva contraseña debe ser diferente a la actual",
        }
    )
    .refine(
        (data) => data.newPassword === data.confirmPassword,
        {
            path: ["confirmPassword"],
            message: "Las contraseñas no coinciden",
        }
    );







