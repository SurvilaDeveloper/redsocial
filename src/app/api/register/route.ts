// src/app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/zod";
import { registerUser } from "@/lib/auth/register-user";
import {
    ImageUploadValidationError,
    assertRequestSizeIsReasonable,
    createValidatedSharp,
    destroyCloudinaryImageBestEffort,
    uploadImageBufferToCloudinary,
    validateAuthenticatedImageUpload,
} from "@/lib/cloudinary-upload-security";

export const runtime = "nodejs";

function statusForRegistrationError(
    code: "INVALID_DATA" | "USER_EXISTS" | "INTERNAL_ERROR"
) {
    if (code === "INVALID_DATA") return 400;
    if (code === "USER_EXISTS") return 409;
    return 500;
}

export async function POST(req: NextRequest) {
    let uploadedImage:
        | { url: string; publicId: string }
        | null = null;

    try {
        assertRequestSizeIsReasonable(
            req.headers.get("content-length")
        );

        const formData = await req.formData();

        const parsed = signUpSchema.safeParse({
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
            name: String(formData.get("name") ?? ""),
        });

        if (!parsed.success) {
            const validationError = parsed.error.errors
                .map((err) => err.message)
                .join(", ");

            return NextResponse.json(
                {
                    error: `Datos inválidos: ${validationError}`,
                },
                { status: 400 }
            );
        }

        // Evita subir a Cloudinary en el caso normal de email repetido.
        // registerUser vuelve a verificar para cubrir carreras.
        const existing = await prisma.user.findUnique({
            where: { email: parsed.data.email },
            select: { id: true },
        });

        if (existing) {
            return NextResponse.json(
                { error: "El usuario ya existe." },
                { status: 409 }
            );
        }

        const fileValue = formData.get("file");

        if (fileValue != null) {
            if (!(fileValue instanceof Blob)) {
                return NextResponse.json(
                    { error: "Archivo inválido." },
                    { status: 400 }
                );
            }

            if (fileValue.size > 0) {
                const validated =
                    await validateAuthenticatedImageUpload(
                        fileValue
                    );

                const processedBuffer =
                    await createValidatedSharp(
                        validated.inputBuffer
                    )
                        .rotate()
                        .resize(64, 64, {
                            fit: "cover",
                            position: "centre",
                            withoutEnlargement: true,
                        })
                        .jpeg({
                            quality: 80,
                            mozjpeg: true,
                        })
                        .toBuffer();

                const uploadResult =
                    await uploadImageBufferToCloudinary(
                        processedBuffer,
                        "users"
                    );

                uploadedImage = {
                    url: uploadResult.secure_url,
                    publicId: uploadResult.public_id,
                };
            }
        }

        const result = await registerUser(
            parsed.data,
            uploadedImage
        );

        if (!result.success) {
            if (uploadedImage?.publicId) {
                await destroyCloudinaryImageBestEffort(
                    uploadedImage.publicId
                );
            }

            return NextResponse.json(
                { error: result.error },
                {
                    status: statusForRegistrationError(
                        result.code
                    ),
                }
            );
        }

        return NextResponse.json(
            {
                success: true,
                email: result.email,
            },
            { status: 201 }
        );
    } catch (error) {
        if (uploadedImage?.publicId) {
            await destroyCloudinaryImageBestEffort(
                uploadedImage.publicId
            );
        }

        if (error instanceof ImageUploadValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        console.error("register route error:", error);

        return NextResponse.json(
            { error: "Error creando la cuenta." },
            { status: 500 }
        );
    }
}
