import { NextRequest } from "next/server";

export function getRequestMetadata(req: NextRequest) {
    const userAgent = req.headers.get("user-agent");

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip =
        forwardedFor?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        null;

    return {
        ip,
        userAgent,
    };
}
