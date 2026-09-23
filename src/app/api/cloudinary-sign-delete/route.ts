import { NextResponse } from "next/server";

/**
 * Deprecated endpoint.
 *
 * Cloudinary deletions are now executed only on the server after
 * authenticating the user and validating post ownership.
 */
export async function POST() {
    return NextResponse.json(
        {
            error:
                "This endpoint has been removed. Cloudinary deletions are handled server-side.",
        },
        { status: 410 }
    );
}
