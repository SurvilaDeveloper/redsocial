// src/app/api/cloudinary-upload-profile/route.ts
import { NextResponse } from "next/server";

function gone() {
    return NextResponse.json(
        {
            error: "Legacy direct profile upload is disabled.",
            registerEndpoint: "/api/register",
            authenticatedUploadEndpoint:
                "/api/upload-profile-image",
        },
        { status: 410 }
    );
}

export async function GET() {
    return gone();
}

export async function POST() {
    return gone();
}
