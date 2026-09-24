// src/app/api/upload-profile-image/route.ts
import { NextRequest, NextResponse } from "next/server";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import {
    ImageUploadValidationError,
    assertRequestSizeIsReasonable,
    createValidatedSharp,
    destroyCloudinaryImageBestEffort,
    uploadImageBufferToCloudinary,
    validateAuthenticatedImageUpload,
} from "@/lib/cloudinary-upload-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const session = await auth();
    const userId =
        session?.user?.id != null
            ? Number(session.user.id)
            : null;

    if (!userId || !Number.isFinite(userId)) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    let uploadedPublicId: string | null = null;

    try {
        assertRequestSizeIsReasonable(
            req.headers.get("content-length")
        );

        const formData = await req.formData();

        const validated =
            await validateAuthenticatedImageUpload(
                formData.get("file")
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

        uploadedPublicId = uploadResult.public_id;

        try {
            await prisma.cloudinaryImage.create({
                data: {
                    userId,
                    url: uploadResult.secure_url,
                    publicId: uploadResult.public_id,
                },
            });
        } catch (error) {
            await destroyCloudinaryImageBestEffort(
                uploadResult.public_id
            );

            uploadedPublicId = null;

            console.error(
                "upload-profile-image ownership registration failed:",
                error
            );

            return NextResponse.json(
                {
                    error: "No se pudo registrar la imagen subida.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        });
    } catch (error) {
        if (uploadedPublicId) {
            await destroyCloudinaryImageBestEffort(
                uploadedPublicId
            );
        }

        if (error instanceof ImageUploadValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        console.error(
            "upload-profile-image error:",
            error
        );

        return NextResponse.json(
            {
                error: "Error procesando/subiendo la imagen",
            },
            { status: 500 }
        );
    }
}
