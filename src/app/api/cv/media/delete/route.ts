// src/app/api/cv/media/delete/route.ts
import { NextRequest, NextResponse } from "next/server";

import auth from "@/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import {
    inspectCloudinaryAssetOwnership,
    markCloudinaryAssetDeleted,
} from "@/lib/cloudinary-asset-ownership";

export const runtime = "nodejs";

function uniqueLabels(labels: string[]) {
    return Array.from(
        new Set(
            labels
                .map((label) => label.trim())
                .filter(Boolean)
        )
    );
}

export async function DELETE(
    req: NextRequest
) {
    try {
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

        const id = Number(body?.id);

        if (
            !Number.isFinite(id) ||
            id <= 0
        ) {
            return NextResponse.json(
                { error: "id inválido" },
                { status: 400 }
            );
        }

        const media =
            await prisma.curriculumMedia.findFirst(
                {
                    where: {
                        id,
                        userId,
                    },
                    select: {
                        id: true,
                        publicId: true,
                        status: true,
                    },
                }
            );

        if (!media) {
            return NextResponse.json(
                {
                    error:
                        "Media no encontrada",
                },
                { status: 404 }
            );
        }

        if (
            media.status === "deleted"
        ) {
            return NextResponse.json({
                ok: true,
            });
        }

        const inspection =
            await inspectCloudinaryAssetOwnership(
                media.publicId,
                userId
            );

        if (
            !inspection.known ||
            !inspection.ownedByRequester ||
            inspection.hasForeignOwner
        ) {
            return NextResponse.json(
                {
                    error:
                        "No tenés permiso para eliminar esta imagen.",
                    code: "ASSET_NOT_OWNED",
                },
                { status: 403 }
            );
        }

        const blockingUsages =
            inspection.activeUsages.filter(
                (usage) =>
                    !(
                        usage.kind ===
                            "cv.media" &&
                        usage.entityId ===
                            media.id
                    )
            );

        if (blockingUsages.length > 0) {
            const references =
                uniqueLabels(
                    blockingUsages.map(
                        (usage) =>
                            usage.label
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

        if (
            inspection.resourceTypes.includes(
                "video"
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "El recurso no es una imagen eliminable desde este flujo.",
                    code: "UNSUPPORTED_ASSET_TYPE",
                },
                { status: 409 }
            );
        }

        const cloudResult =
            await cloudinary.uploader.destroy(
                media.publicId,
                {
                    resource_type: "image",
                    invalidate: true,
                }
            );

        const result = String(
            (cloudResult as any)
                ?.result ?? ""
        );

        if (
            result !== "ok" &&
            result !== "not found"
        ) {
            console.error(
                "cv/media/delete Cloudinary failure:",
                media.publicId,
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
            ok: true,
            cloudinaryResult: result,
        });
    } catch (err) {
        console.error(
            "cv/media/delete error:",
            err
        );

        return NextResponse.json(
            {
                error:
                    "Error eliminando imagen",
            },
            { status: 500 }
        );
    }
}
