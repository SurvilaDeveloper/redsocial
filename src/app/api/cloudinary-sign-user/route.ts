// src/app/api/cloudinary-sign-user/route.ts
import { NextResponse } from "next/server";

/**
 * Stage 3:
 * la firma pública para avatar queda retirada.
 *
 * Registro:
 * POST /api/register (multipart)
 *
 * Usuario autenticado:
 * POST /api/upload-profile-image
 */
export async function GET() {
    return NextResponse.json(
        {
            error: "Direct Cloudinary profile uploads are disabled.",
            registerEndpoint: "/api/register",
            authenticatedUploadEndpoint:
                "/api/upload-profile-image",
        },
        { status: 410 }
    );
}
