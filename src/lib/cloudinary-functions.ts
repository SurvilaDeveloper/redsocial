//src/lib/cloudinary-functions.ts
export async function uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Error upload-profile-image:", data);
        throw new Error(data?.error || "Error subiendo imagen de perfil");
    }

    return {
        url: data.url as string,
        publicId: data.publicId as string,
    };
}


export async function uploadPostImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-post-image", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Error upload-post-image:", data);
        throw new Error(data?.error || "Error subiendo imagen");
    }

    return {
        url: data.url as string,
        publicId: data.publicId as string,
    };
}

export async function deletePostImage(image: { url: string, publicId: string }) {
    // 1. Enviar el `public_id` al backend para generar la firma
    const signatureRes = await fetch("/api/cloudinary-sign-delete", {
        method: "POST",   // Asegúrate de que sea POST
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            publicId: image.publicId,  // Enviar el `public_id` en el cuerpo de la solicitud
        }),
    });

    // 2. Procesar la respuesta del backend con la firma y otros datos
    const { signature, timestamp, apiKey, cloudName } = await signatureRes.json();

    // 3. Crear el FormData para la solicitud de eliminación
    const formData = new FormData();
    formData.append("public_id", image.publicId);  // Pasamos el `public_id`
    formData.append("api_key", apiKey);           // Pasamos el `api_key`
    formData.append("timestamp", timestamp.toString());  // Pasamos el `timestamp`
    formData.append("signature", signature);     // Pasamos la firma

    // 4. Hacer la solicitud POST a Cloudinary para eliminar la imagen
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body: formData,
    });

    const data = await res.json();

    // 5. Manejar la respuesta
    if (data.result === "ok") {
        return { success: true };
    } else {
        return { error: "Error deleting image", details: data };
    }
}







