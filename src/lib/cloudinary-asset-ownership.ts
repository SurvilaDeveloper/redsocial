// src/lib/cloudinary-asset-ownership.ts
import { prisma } from "@/lib/prisma";

export type CloudinaryResourceType = "image" | "video";

export type CloudinaryAssetUsage = {
    kind:
        | "user.profile"
        | "user.wall"
        | "post.image"
        | "product.media"
        | "product.thumbnail"
        | "service.media"
        | "service.thumbnail"
        | "cv.media"
        | "cv.content"
        | "business.header"
        | "business.content";
    entityId: number | null;
    ownerUserId: number;
    label: string;
    resourceType: CloudinaryResourceType;
};

export type CloudinaryAssetInspection = {
    publicId: string;
    known: boolean;
    ownedByRequester: boolean;
    hasForeignOwner: boolean;
    ownerUserIds: number[];
    resourceTypes: CloudinaryResourceType[];
    activeUsages: CloudinaryAssetUsage[];
    canonicalUrls: string[];
    cleanup: {
        cloudinaryImageId: number | null;
        profileUserIds: number[];
        wallUserIds: number[];
        postImageIds: number[];
        productMainIds: number[];
        productThumbnailIds: number[];
        serviceMainIds: number[];
        serviceThumbnailIds: number[];
        curriculumMediaIds: number[];
        deletedBusinessHeaderIds: number[];
    };
};

const DELETED_SVG_URL = "/image-deleted.svg";

function uniqueNumbers(values: number[]) {
    return Array.from(
        new Set(
            values.filter(
                (value) =>
                    Number.isFinite(value) &&
                    value > 0
            )
        )
    );
}

function addUrl(
    urls: Set<string>,
    value: string | null | undefined
) {
    const url = String(value ?? "").trim();

    if (
        !url ||
        url === DELETED_SVG_URL ||
        url.startsWith(`${DELETED_SVG_URL}?`)
    ) {
        return;
    }

    urls.add(url);
}

function jsonReferencesAsset(
    value: unknown,
    {
        publicId,
        urls,
        mediaId,
    }: {
        publicId: string;
        urls: Set<string>;
        mediaId: number | null;
    }
): boolean {
    if (value == null) return false;

    if (Array.isArray(value)) {
        return value.some((item) =>
            jsonReferencesAsset(item, {
                publicId,
                urls,
                mediaId,
            })
        );
    }

    if (typeof value !== "object") {
        return false;
    }

    const record = value as Record<string, unknown>;

    if (
        typeof record.publicId === "string" &&
        record.publicId === publicId
    ) {
        return true;
    }

    if (
        typeof record.url === "string" &&
        urls.has(record.url)
    ) {
        return true;
    }

    if (
        mediaId != null &&
        Number(record.mediaId) === mediaId
    ) {
        return true;
    }

    return Object.values(record).some((item) =>
        jsonReferencesAsset(item, {
            publicId,
            urls,
            mediaId,
        })
    );
}

function pushUsage(
    target: CloudinaryAssetUsage[],
    seen: Set<string>,
    usage: CloudinaryAssetUsage
) {
    const key = [
        usage.kind,
        usage.entityId ?? "none",
        usage.ownerUserId,
    ].join(":");

    if (seen.has(key)) return;

    seen.add(key);
    target.push(usage);
}

export async function inspectCloudinaryAssetOwnership(
    publicId: string,
    requesterUserId: number
): Promise<CloudinaryAssetInspection> {
    const [
        cloudRow,
        userRows,
        postRows,
        productRows,
        serviceRows,
        cvRows,
    ] = await Promise.all([
        prisma.cloudinaryImage.findUnique({
            where: { publicId },
            select: {
                id: true,
                userId: true,
                url: true,
                deletedAt: true,
                businessesHeaderBg: {
                    select: {
                        id: true,
                        ownerId: true,
                        name: true,
                        active: true,
                        deletedAt: true,
                    },
                },
            },
        }),

        prisma.user.findMany({
            where: {
                OR: [
                    { imagePublicId: publicId },
                    { imageWallPublicId: publicId },
                ],
            },
            select: {
                id: true,
                name: true,
                active: true,
                deletedAt: true,
                imageUrl: true,
                imagePublicId: true,
                imageWallUrl: true,
                imageWallPublicId: true,
            },
        }),

        prisma.image.findMany({
            where: {
                imagePublicId: publicId,
            },
            select: {
                id: true,
                active: true,
                imageUrl: true,
                post: {
                    select: {
                        id: true,
                        title: true,
                        authorId: true,
                        active: true,
                        deletedAt: true,
                    },
                },
            },
        }),

        prisma.productListingMedia.findMany({
            where: {
                OR: [
                    { publicId },
                    { thumbnailPublicId: publicId },
                ],
            },
            select: {
                id: true,
                type: true,
                active: true,
                url: true,
                publicId: true,
                thumbnailUrl: true,
                thumbnailPublicId: true,
                listing: {
                    select: {
                        id: true,
                        title: true,
                        user_id: true,
                        active: true,
                        deletedAt: true,
                    },
                },
            },
        }),

        prisma.serviceListingMedia.findMany({
            where: {
                OR: [
                    { publicId },
                    { thumbnailPublicId: publicId },
                ],
            },
            select: {
                id: true,
                type: true,
                active: true,
                url: true,
                publicId: true,
                thumbnailUrl: true,
                thumbnailPublicId: true,
                listing: {
                    select: {
                        id: true,
                        title: true,
                        user_id: true,
                        active: true,
                        deletedAt: true,
                    },
                },
            },
        }),

        prisma.curriculumMedia.findMany({
            where: {
                publicId,
            },
            select: {
                id: true,
                userId: true,
                curriculumId: true,
                url: true,
                thumbUrl: true,
                status: true,
                deletedAt: true,
            },
        }),
    ]);

    const owners = new Set<number>();
    const resourceTypes =
        new Set<CloudinaryResourceType>();
    const canonicalUrls = new Set<string>();
    const usages: CloudinaryAssetUsage[] = [];
    const usageKeys = new Set<string>();

    const profileUserIds: number[] = [];
    const wallUserIds: number[] = [];
    const postImageIds: number[] = [];
    const productMainIds: number[] = [];
    const productThumbnailIds: number[] = [];
    const serviceMainIds: number[] = [];
    const serviceThumbnailIds: number[] = [];
    const curriculumMediaIds: number[] = [];
    const deletedBusinessHeaderIds: number[] = [];

    if (cloudRow) {
        resourceTypes.add("image");
        addUrl(canonicalUrls, cloudRow.url);

        if (cloudRow.userId != null) {
            owners.add(cloudRow.userId);
        }

        for (const business of cloudRow.businessesHeaderBg) {
            owners.add(business.ownerId);

            if (business.deletedAt == null) {
                pushUsage(usages, usageKeys, {
                    kind: "business.header",
                    entityId: business.id,
                    ownerUserId: business.ownerId,
                    label: `Cabecera del negocio "${business.name}"`,
                    resourceType: "image",
                });
            } else {
                deletedBusinessHeaderIds.push(
                    business.id
                );
            }
        }
    }

    for (const user of userRows) {
        owners.add(user.id);
        resourceTypes.add("image");

        if (user.imagePublicId === publicId) {
            profileUserIds.push(user.id);
            addUrl(canonicalUrls, user.imageUrl);

            if (user.deletedAt == null) {
                pushUsage(usages, usageKeys, {
                    kind: "user.profile",
                    entityId: user.id,
                    ownerUserId: user.id,
                    label: "Foto de perfil",
                    resourceType: "image",
                });
            }
        }

        if (user.imageWallPublicId === publicId) {
            wallUserIds.push(user.id);
            addUrl(canonicalUrls, user.imageWallUrl);

            if (user.deletedAt == null) {
                pushUsage(usages, usageKeys, {
                    kind: "user.wall",
                    entityId: user.id,
                    ownerUserId: user.id,
                    label: "Portada del perfil",
                    resourceType: "image",
                });
            }
        }
    }

    for (const row of postRows) {
        owners.add(row.post.authorId);
        resourceTypes.add("image");
        postImageIds.push(row.id);
        addUrl(canonicalUrls, row.imageUrl);

        if (
            row.active !== 0 &&
            row.post.deletedAt == null
        ) {
            pushUsage(usages, usageKeys, {
                kind: "post.image",
                entityId: row.id,
                ownerUserId: row.post.authorId,
                label:
                    row.post.title?.trim()
                        ? `Imagen del post "${row.post.title}"`
                        : `Imagen del post #${row.post.id}`,
                resourceType: "image",
            });
        }
    }

    for (const row of productRows) {
        const ownerId = row.listing.user_id;
        owners.add(ownerId);

        const mainMatches =
            row.publicId === publicId;
        const thumbMatches =
            row.thumbnailPublicId === publicId;

        if (mainMatches) {
            productMainIds.push(row.id);
            addUrl(canonicalUrls, row.url);

            const resourceType:
                CloudinaryResourceType =
                row.type === "video"
                    ? "video"
                    : "image";

            resourceTypes.add(resourceType);

            if (
                row.active !== 0 &&
                row.listing.deletedAt == null
            ) {
                pushUsage(usages, usageKeys, {
                    kind: "product.media",
                    entityId: row.id,
                    ownerUserId: ownerId,
                    label:
                        row.listing.title?.trim()
                            ? `Media del producto "${row.listing.title}"`
                            : `Media del producto #${row.listing.id}`,
                    resourceType,
                });
            }
        }

        if (thumbMatches) {
            productThumbnailIds.push(row.id);
            addUrl(
                canonicalUrls,
                row.thumbnailUrl
            );
            resourceTypes.add("image");

            if (
                row.active !== 0 &&
                row.listing.deletedAt == null
            ) {
                pushUsage(usages, usageKeys, {
                    kind: "product.thumbnail",
                    entityId: row.id,
                    ownerUserId: ownerId,
                    label:
                        row.listing.title?.trim()
                            ? `Miniatura del producto "${row.listing.title}"`
                            : `Miniatura del producto #${row.listing.id}`,
                    resourceType: "image",
                });
            }
        }
    }

    for (const row of serviceRows) {
        const ownerId = row.listing.user_id;
        owners.add(ownerId);

        const mainMatches =
            row.publicId === publicId;
        const thumbMatches =
            row.thumbnailPublicId === publicId;

        if (mainMatches) {
            serviceMainIds.push(row.id);
            addUrl(canonicalUrls, row.url);

            const resourceType:
                CloudinaryResourceType =
                row.type === "video"
                    ? "video"
                    : "image";

            resourceTypes.add(resourceType);

            if (
                row.active !== 0 &&
                row.listing.deletedAt == null
            ) {
                pushUsage(usages, usageKeys, {
                    kind: "service.media",
                    entityId: row.id,
                    ownerUserId: ownerId,
                    label:
                        row.listing.title?.trim()
                            ? `Media del servicio "${row.listing.title}"`
                            : `Media del servicio #${row.listing.id}`,
                    resourceType,
                });
            }
        }

        if (thumbMatches) {
            serviceThumbnailIds.push(row.id);
            addUrl(
                canonicalUrls,
                row.thumbnailUrl
            );
            resourceTypes.add("image");

            if (
                row.active !== 0 &&
                row.listing.deletedAt == null
            ) {
                pushUsage(usages, usageKeys, {
                    kind: "service.thumbnail",
                    entityId: row.id,
                    ownerUserId: ownerId,
                    label:
                        row.listing.title?.trim()
                            ? `Miniatura del servicio "${row.listing.title}"`
                            : `Miniatura del servicio #${row.listing.id}`,
                    resourceType: "image",
                });
            }
        }
    }

    for (const row of cvRows) {
        owners.add(row.userId);
        resourceTypes.add("image");
        curriculumMediaIds.push(row.id);

        addUrl(canonicalUrls, row.url);
        addUrl(canonicalUrls, row.thumbUrl);

        if (
            row.status === "active" &&
            row.deletedAt == null
        ) {
            pushUsage(usages, usageKeys, {
                kind: "cv.media",
                entityId: row.id,
                ownerUserId: row.userId,
                label: "Biblioteca de imágenes del CV",
                resourceType: "image",
            });
        }
    }

    const known =
        cloudRow != null ||
        userRows.length > 0 ||
        postRows.length > 0 ||
        productRows.length > 0 ||
        serviceRows.length > 0 ||
        cvRows.length > 0;

    const ownerUserIds =
        Array.from(owners).sort(
            (a, b) => a - b
        );

    const ownedByRequester =
        owners.has(requesterUserId);

    const hasForeignOwner =
        ownerUserIds.some(
            (id) => id !== requesterUserId
        );

    if (
        known &&
        ownedByRequester &&
        !hasForeignOwner
    ) {
        const urls = canonicalUrls;

        const curriculum =
            await prisma.curriculum.findUnique({
                where: {
                    userId: requesterUserId,
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                },
            });

        if (
            curriculum &&
            jsonReferencesAsset(
                curriculum.content,
                {
                    publicId,
                    urls,
                    mediaId:
                        cloudRow?.id ?? null,
                }
            )
        ) {
            pushUsage(usages, usageKeys, {
                kind: "cv.content",
                entityId: curriculum.id,
                ownerUserId:
                    requesterUserId,
                label:
                    curriculum.title?.trim()
                        ? `CV "${curriculum.title}"`
                        : "CV",
                resourceType: "image",
            });
        }

        const businesses =
            await prisma.business.findMany({
                where: {
                    ownerId:
                        requesterUserId,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    name: true,
                    headerBgImageId: true,
                    site: {
                        select: {
                            homeContent: true,
                            themeConfig: true,
                        },
                    },
                    pages: {
                        where: {
                            deletedAt: null,
                        },
                        select: {
                            id: true,
                            title: true,
                            content: true,
                        },
                    },
                },
            });

        for (const business of businesses) {
            const headerUses =
                cloudRow != null &&
                business.headerBgImageId ===
                    cloudRow.id;

            if (headerUses) {
                pushUsage(usages, usageKeys, {
                    kind: "business.header",
                    entityId: business.id,
                    ownerUserId:
                        requesterUserId,
                    label: `Cabecera del negocio "${business.name}"`,
                    resourceType: "image",
                });
            }

            const siteUses =
                jsonReferencesAsset(
                    business.site
                        ?.homeContent,
                    {
                        publicId,
                        urls,
                        mediaId:
                            cloudRow?.id ??
                            null,
                    }
                ) ||
                jsonReferencesAsset(
                    business.site
                        ?.themeConfig,
                    {
                        publicId,
                        urls,
                        mediaId:
                            cloudRow?.id ??
                            null,
                    }
                );

            if (siteUses) {
                pushUsage(usages, usageKeys, {
                    kind: "business.content",
                    entityId: business.id,
                    ownerUserId:
                        requesterUserId,
                    label: `Sitio del negocio "${business.name}"`,
                    resourceType: "image",
                });
            }

            for (const page of business.pages) {
                if (
                    jsonReferencesAsset(
                        page.content,
                        {
                            publicId,
                            urls,
                            mediaId:
                                cloudRow?.id ??
                                null,
                        }
                    )
                ) {
                    pushUsage(
                        usages,
                        usageKeys,
                        {
                            kind: "business.content",
                            entityId:
                                page.id,
                            ownerUserId:
                                requesterUserId,
                            label: `Página "${page.title}" del negocio "${business.name}"`,
                            resourceType:
                                "image",
                        }
                    );
                }
            }
        }
    }

    return {
        publicId,
        known,
        ownedByRequester,
        hasForeignOwner,
        ownerUserIds,
        resourceTypes:
            Array.from(resourceTypes),
        activeUsages: usages,
        canonicalUrls:
            Array.from(canonicalUrls),
        cleanup: {
            cloudinaryImageId:
                cloudRow?.id ?? null,
            profileUserIds:
                uniqueNumbers(
                    profileUserIds
                ),
            wallUserIds:
                uniqueNumbers(
                    wallUserIds
                ),
            postImageIds:
                uniqueNumbers(
                    postImageIds
                ),
            productMainIds:
                uniqueNumbers(
                    productMainIds
                ),
            productThumbnailIds:
                uniqueNumbers(
                    productThumbnailIds
                ),
            serviceMainIds:
                uniqueNumbers(
                    serviceMainIds
                ),
            serviceThumbnailIds:
                uniqueNumbers(
                    serviceThumbnailIds
                ),
            curriculumMediaIds:
                uniqueNumbers(
                    curriculumMediaIds
                ),
            deletedBusinessHeaderIds:
                uniqueNumbers(
                    deletedBusinessHeaderIds
                ),
        },
    };
}

export async function markCloudinaryAssetDeleted(
    inspection: CloudinaryAssetInspection
) {
    const now = new Date();
    const cleanup = inspection.cleanup;

    await prisma.$transaction(
        async (tx) => {
            if (
                cleanup.profileUserIds
                    .length > 0
            ) {
                await tx.user.updateMany({
                    where: {
                        id: {
                            in: cleanup.profileUserIds,
                        },
                        imagePublicId:
                            inspection.publicId,
                    },
                    data: {
                        imageUrl:
                            DELETED_SVG_URL,
                        imagePublicId: null,
                    },
                });
            }

            if (
                cleanup.wallUserIds
                    .length > 0
            ) {
                await tx.user.updateMany({
                    where: {
                        id: {
                            in: cleanup.wallUserIds,
                        },
                        imageWallPublicId:
                            inspection.publicId,
                    },
                    data: {
                        imageWallUrl:
                            DELETED_SVG_URL,
                        imageWallPublicId:
                            null,
                    },
                });
            }

            if (
                cleanup.postImageIds
                    .length > 0
            ) {
                await tx.image.updateMany({
                    where: {
                        id: {
                            in: cleanup.postImageIds,
                        },
                        imagePublicId:
                            inspection.publicId,
                    },
                    data: {
                        imageUrl:
                            DELETED_SVG_URL,
                        imagePublicId: null,
                        active: 0,
                    },
                });
            }

            if (
                cleanup.productMainIds
                    .length > 0
            ) {
                await tx.productListingMedia.updateMany(
                    {
                        where: {
                            id: {
                                in: cleanup.productMainIds,
                            },
                            publicId:
                                inspection.publicId,
                        },
                        data: {
                            url: DELETED_SVG_URL,
                            publicId: null,
                            active: 0,
                            index: null,
                        },
                    }
                );
            }

            if (
                cleanup
                    .productThumbnailIds
                    .length > 0
            ) {
                await tx.productListingMedia.updateMany(
                    {
                        where: {
                            id: {
                                in: cleanup.productThumbnailIds,
                            },
                            thumbnailPublicId:
                                inspection.publicId,
                        },
                        data: {
                            thumbnailUrl:
                                DELETED_SVG_URL,
                            thumbnailPublicId:
                                null,
                        },
                    }
                );
            }

            if (
                cleanup.serviceMainIds
                    .length > 0
            ) {
                await tx.serviceListingMedia.updateMany(
                    {
                        where: {
                            id: {
                                in: cleanup.serviceMainIds,
                            },
                            publicId:
                                inspection.publicId,
                        },
                        data: {
                            url: DELETED_SVG_URL,
                            publicId: null,
                            active: 0,
                            index: null,
                        },
                    }
                );
            }

            if (
                cleanup
                    .serviceThumbnailIds
                    .length > 0
            ) {
                await tx.serviceListingMedia.updateMany(
                    {
                        where: {
                            id: {
                                in: cleanup.serviceThumbnailIds,
                            },
                            thumbnailPublicId:
                                inspection.publicId,
                        },
                        data: {
                            thumbnailUrl:
                                DELETED_SVG_URL,
                            thumbnailPublicId:
                                null,
                        },
                    }
                );
            }

            if (
                cleanup.curriculumMediaIds
                    .length > 0
            ) {
                await tx.curriculumMedia.updateMany(
                    {
                        where: {
                            id: {
                                in: cleanup.curriculumMediaIds,
                            },
                            publicId:
                                inspection.publicId,
                        },
                        data: {
                            status: "deleted",
                            deletedAt: now,
                            replacedUrl:
                                DELETED_SVG_URL,
                        },
                    }
                );
            }

            if (
                cleanup
                    .deletedBusinessHeaderIds
                    .length > 0
            ) {
                await tx.business.updateMany({
                    where: {
                        id: {
                            in: cleanup
                                .deletedBusinessHeaderIds,
                        },
                    },
                    data: {
                        headerBgImageId: null,
                    },
                });
            }

            if (
                cleanup.cloudinaryImageId !=
                null
            ) {
                await tx.cloudinaryImage.updateMany(
                    {
                        where: {
                            id: cleanup
                                .cloudinaryImageId,
                            publicId:
                                inspection.publicId,
                        },
                        data: {
                            deletedAt: now,
                            url: DELETED_SVG_URL,
                        },
                    }
                );
            }
        }
    );
}
