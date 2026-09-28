// src/lib/cloudinary-listing-media.ts
import {
    MediaUploadValidationError,
    createValidatedSharp,
    destroyCloudinaryAssetBestEffort,
    isAllowedCloudinaryVideoFormat,
    isListingImageMime,
    isListingVideoMime,
    uploadImageBufferToCloudinary,
    uploadVideoBufferToCloudinary,
    validateListingImageUpload,
    validateListingVideoUpload,
    type CloudinaryResourceType,
} from "@/lib/cloudinary-upload-security";

export type UploadedListingMedia = {
    type: "image" | "video";
    url: string;
    publicId: string;
    thumbnailUrl: string | null;
    thumbnailPublicId: string | null;
    durationSec: number | null;
    format: string | null;
    cleanupAssets: Array<{
        publicId: string;
        resourceType: CloudinaryResourceType;
    }>;
};

export async function rollbackUploadedListingMedia(
    uploaded: UploadedListingMedia
) {
    await Promise.all(
        uploaded.cleanupAssets.map((asset) =>
            destroyCloudinaryAssetBestEffort(
                asset.publicId,
                asset.resourceType
            )
        )
    );
}

export async function uploadValidatedListingMedia(
    value: FormDataEntryValue | null,
    folders: {
        main: string;
        thumbnail: string;
    }
): Promise<UploadedListingMedia> {
    if (!(value instanceof Blob)) {
        throw new MediaUploadValidationError(
            "Archivo inválido."
        );
    }

    const mime = value.type.toLowerCase();

    if (isListingImageMime(mime)) {
        const validated =
            await validateListingImageUpload(value);

        const [mainBuffer, thumbnailBuffer] =
            await Promise.all([
                createValidatedSharp(
                    validated.inputBuffer
                )
                    .rotate()
                    .resize(1600, null, {
                        withoutEnlargement: true,
                    })
                    .jpeg({
                        quality: 82,
                        mozjpeg: true,
                    })
                    .toBuffer(),

                createValidatedSharp(
                    validated.inputBuffer
                )
                    .rotate()
                    .resize(360, 360, {
                        fit: "cover",
                    })
                    .jpeg({
                        quality: 75,
                        mozjpeg: true,
                    })
                    .toBuffer(),
            ]);

        const main =
            await uploadImageBufferToCloudinary(
                mainBuffer,
                folders.main
            );

        try {
            const thumbnail =
                await uploadImageBufferToCloudinary(
                    thumbnailBuffer,
                    folders.thumbnail
                );

            return {
                type: "image",
                url: main.secure_url,
                publicId: main.public_id,
                thumbnailUrl:
                    thumbnail.secure_url,
                thumbnailPublicId:
                    thumbnail.public_id,
                durationSec: null,
                format: "jpg",
                cleanupAssets: [
                    {
                        publicId: main.public_id,
                        resourceType: "image",
                    },
                    {
                        publicId:
                            thumbnail.public_id,
                        resourceType: "image",
                    },
                ],
            };
        } catch (error) {
            await destroyCloudinaryAssetBestEffort(
                main.public_id,
                "image"
            );
            throw error;
        }
    }

    if (isListingVideoMime(mime)) {
        const validated =
            await validateListingVideoUpload(value);

        const uploaded =
            await uploadVideoBufferToCloudinary(
                validated.inputBuffer,
                folders.main
            );

        if (
            !isAllowedCloudinaryVideoFormat(
                uploaded.format
            )
        ) {
            await destroyCloudinaryAssetBestEffort(
                uploaded.public_id,
                "video"
            );

            throw new MediaUploadValidationError(
                "Cloudinary no reconoció el archivo como un video MP4, WebM o MOV permitido."
            );
        }

        return {
            type: "video",
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            thumbnailUrl: null,
            thumbnailPublicId: null,
            durationSec:
                uploaded.duration != null
                    ? Math.round(uploaded.duration)
                    : null,
            format: uploaded.format,
            cleanupAssets: [
                {
                    publicId:
                        uploaded.public_id,
                    resourceType: "video",
                },
            ],
        };
    }

    throw new MediaUploadValidationError(
        "Tipo de archivo no soportado. Usa JPEG, PNG, WebP, MP4, WebM o MOV."
    );
}
