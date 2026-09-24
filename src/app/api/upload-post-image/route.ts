// src/app/api/upload-post-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
import {
    ImageUploadValidationError,
    assertRequestSizeIsReasonable,
    createValidatedSharp,
    uploadImageBufferToCloudinary,
    validateAuthenticatedImageUpload,
} from "@/lib/cloudinary-upload-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        assertRequestSizeIsReasonable(req.headers.get("content-length"));

        const formData = await req.formData();
        const validated = await validateAuthenticatedImageUpload(
            formData.get("file")
        );

        const processedBuffer = await createValidatedSharp(
            validated.inputBuffer
        )
            .rotate()
            .resize(256, null, { withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();

        const uploadResult = await uploadImageBufferToCloudinary(
            processedBuffer,
            "posts"
        );

        return NextResponse.json({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        });
    } catch (error) {
        if (error instanceof ImageUploadValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        console.error("upload-post-image error:", error);
        return NextResponse.json(
            { error: "Error procesando/subiendo la imagen" },
            { status: 500 }
        );
    }
}
