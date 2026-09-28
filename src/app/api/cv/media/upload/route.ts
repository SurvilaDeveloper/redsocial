// src/app/api/cv/media/upload/route.ts
import { NextRequest, NextResponse } from "next/server";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRateLimitClientIp } from "@/lib/rate-limit-client-ip";
import {
    authenticatedUploadRules,
    cvUploadRules,
} from "@/lib/rate-limit-policies";
import {
    enforceRateLimits,
    isRateLimitInfrastructureError,
    rateLimitUnavailableResponse,
} from "@/lib/rate-limit";
import {
    ImageUploadValidationError,
    assertRequestSizeIsReasonable,
    createValidatedSharp,
    destroyCloudinaryImageBestEffort,
    uploadImageBufferToCloudinaryWithEager,
    validateAuthenticatedImageUpload,
} from "@/lib/cloudinary-upload-security";

export const runtime = "nodejs";

function parseCurriculumId(value: FormDataEntryValue | null) {
    if (
        typeof value !== "string" ||
        !value.trim() ||
        value === "null"
    ) {
        return null;
    }

    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new ImageUploadValidationError(
            "curriculumId inválido."
        );
    }

    return id;
}

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

        const ip = getRateLimitClientIp(req.headers);
        const rateLimited = await enforceRateLimits([
            ...authenticatedUploadRules(userId, ip),
            ...cvUploadRules(userId),
        ]);

        if (rateLimited) return rateLimited;

        const formData = await req.formData();
        const curriculumId = parseCurriculumId(
            formData.get("curriculumId")
        );

        if (curriculumId !== null) {
            const cv = await prisma.curriculum.findFirst({
                where: {
                    id: curriculumId,
                    userId,
                },
                select: { id: true },
            });

            if (!cv) {
                return NextResponse.json(
                    { error: "CV no encontrado." },
                    { status: 404 }
                );
            }
        }

        const validated =
            await validateAuthenticatedImageUpload(
                formData.get("file")
            );

        const processedBuffer =
            await createValidatedSharp(
                validated.inputBuffer
            )
                .rotate()
                .resize(1200, 1200, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .jpeg({
                    quality: 82,
                    mozjpeg: true,
                })
                .toBuffer();

        const uploaded =
            await uploadImageBufferToCloudinaryWithEager(
                processedBuffer,
                "cv",
                [
                    {
                        width: 160,
                        height: 160,
                        crop: "fill",
                        gravity: "auto",
                        quality: "auto",
                        fetch_format: "auto",
                    },
                ]
            );

        uploadedPublicId = uploaded.public_id;

        const thumbUrl =
            uploaded.eager?.[0]?.secure_url ?? null;

        try {
            const media =
                await prisma.curriculumMedia.create({
                    data: {
                        userId,
                        curriculumId,
                        url: uploaded.secure_url,
                        publicId:
                            uploaded.public_id,
                        thumbUrl,
                        status: "active",
                    },
                    select: {
                        id: true,
                        url: true,
                        publicId: true,
                        thumbUrl: true,
                        status: true,
                        createdAt: true,
                    },
                });

            uploadedPublicId = null;

            return NextResponse.json({
                media,
            });
        } catch (error) {
            await destroyCloudinaryImageBestEffort(
                uploaded.public_id
            );
            uploadedPublicId = null;
            throw error;
        }
    } catch (error) {
        if (isRateLimitInfrastructureError(error)) {
            console.error("cv media upload rate limit error:", error);
            return rateLimitUnavailableResponse();
        }

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
            "cv/media/upload error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Error subiendo/guardando la imagen.",
            },
            { status: 500 }
        );
    }
}
