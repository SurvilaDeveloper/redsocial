// src/app/api/images/delete/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import auth from "@/auth";
import cloudinary from "@/lib/cloudinary";
import {
    inspectCloudinaryAssetOwnership,
    markCloudinaryAssetDeleted,
} from "@/lib/cloudinary-asset-ownership";

export const runtime = "nodejs";

const bodySchema = z.object({
    publicId: z
        .string()
        .trim()
        .min(1)
        .max(255),
});

function uniqueLabels(labels: string[]) {
    return Array.from(
        new Set(
            labels
                .map((label) => label.trim())
                .filter(Boolean)
        )
    );
}

export async function DELETE(req: Request) {
    const session = await auth();

    const userId =
        session?.user?.id != null
            ? Number(session.user.id)
            : null;

    if (
        !userId ||
        !Number.isFinite(userId)
    ) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const body = await req
        .json()
        .catch(() => null);

    const parsed =
        bodySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid data" },
            { status: 400 }
        );
    }

    const { publicId } = parsed.data;

    const inspection =
        await inspectCloudinaryAssetOwnership(
            publicId,
            userId
        );

    if (!inspection.known) {
        return NextResponse.json(
            {
                error: "Imagen no encontrada en tus recursos.",
                code: "ASSET_NOT_OWNED",
            },
            { status: 404 }
        );
    }

    if (
        !inspection.ownedByRequester ||
        inspection.hasForeignOwner
    ) {
        return NextResponse.json(
            {
                error: "No tenés permiso para eliminar esta imagen.",
                code: "ASSET_NOT_OWNED",
            },
            { status: 403 }
        );
    }

    if (
        inspection.resourceTypes.includes(
            "video"
        )
    ) {
        return NextResponse.json(
            {
                error:
                    "Este recurso incluye video y no puede eliminarse desde la biblioteca de imágenes.",
                code: "UNSUPPORTED_ASSET_TYPE",
            },
            { status: 409 }
        );
    }

    if (
        inspection.activeUsages.length >
        0
    ) {
        const references =
            uniqueLabels(
                inspection.activeUsages.map(
                    (usage) => usage.label
                )
            );

        return NextResponse.json(
            {
                error:
                    references.length > 0
                        ? `La imagen está en uso en: ${references.join(", ")}. Quitala de ese contenido antes de eliminarla.`
                        : "La imagen está en uso. Quitala del contenido antes de eliminarla.",
                code: "ASSET_IN_USE",
                references,
            },
            { status: 409 }
        );
    }

    const cloudResult =
        await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: "image",
                invalidate: true,
            }
        );

    const result = String(
        (cloudResult as any)?.result ??
            ""
    );

    if (
        result !== "ok" &&
        result !== "not found"
    ) {
        console.error(
            "Cloudinary delete failed:",
            publicId,
            cloudResult
        );

        return NextResponse.json(
            {
                error:
                    "Cloudinary no confirmó la eliminación de la imagen.",
                code: "CLOUDINARY_DELETE_FAILED",
            },
            { status: 502 }
        );
    }

    await markCloudinaryAssetDeleted(
        inspection
    );

    return NextResponse.json({
        result: "ok",
        cloudinaryResult: result,
    });
}
