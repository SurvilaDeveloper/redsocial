// src/app/api/upload-site-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import auth from "@/auth";
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

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        assertRequestSizeIsReasonable(req.headers.get("content-length"));

        const formData = await req.formData();
        const validated = await validateAuthenticatedImageUpload(
            formData.get("file")
        );

        const [mainBuffer, thumbBuffer] = await Promise.all([
            createValidatedSharp(validated.inputBuffer)
                .rotate()
                .resize(1600, null, { withoutEnlargement: true })
                .jpeg({ quality: 82, mozjpeg: true })
                .toBuffer(),

            createValidatedSharp(validated.inputBuffer)
                .rotate()
                .resize(360, 360, {
                    fit: "cover",
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 75, mozjpeg: true })
                .toBuffer(),
        ]);

        const uploadMain = await uploadImageBufferToCloudinary(
            mainBuffer,
            "sites"
        );

        try {
            const uploadThumb = await uploadImageBufferToCloudinary(
                thumbBuffer,
                "sites/thumbs"
            );

            return NextResponse.json({
                url: uploadMain.secure_url,
                publicId: uploadMain.public_id,
                thumbUrl: uploadThumb.secure_url,
                thumbPublicId: uploadThumb.public_id,
            });
        } catch (error) {
            await destroyCloudinaryImageBestEffort(uploadMain.public_id);
            throw error;
        }
    } catch (error) {
        if (error instanceof ImageUploadValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        console.error("upload-site-image error:", error);
        return NextResponse.json(
            { error: "Error procesando/subiendo la imagen" },
            { status: 500 }
        );
    }
}
