// src/app/api/cloudinary-sign/route.ts
import { NextResponse } from "next/server";

/**
 * Stage 2:
 * El upload directo navegador -> Cloudinary para posts queda deshabilitado.
 * Los posts deben subir imágenes exclusivamente por /api/upload-post-image.
 */
export async function GET() {
    return NextResponse.json(
        {
            error: "Direct Cloudinary post uploads are disabled.",
            uploadEndpoint: "/api/upload-post-image",
        },
        { status: 410 }
    );
}
