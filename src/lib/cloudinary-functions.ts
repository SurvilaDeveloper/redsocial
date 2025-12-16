



export async function uploadProfileImage(file: File) {
    const signatureRes = await fetch("/api/cloudinary-sign-user");
    const { signature, timestamp, apiKey, cloudName, folder } = await signatureRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
    });

    const data = await res.json();
    return {
        url: data.secure_url as string,
        publicId: data.public_id as string, // Guarda esto si luego necesitas eliminar la imagen
    };
}

export async function uploadPostImage(file: File) {
    // 1. Obtener la firma desde el backend
    const signatureRes = await fetch("/api/cloudinary-sign");
    const { signature, timestamp, apiKey, cloudName, folder } = await signatureRes.json();

    // 2. Crear el FormData con los datos necesarios
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder); // Agregar la carpeta donde se guardará la imagen

    // 3. Subir la imagen a Cloudinary
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
    });

    const data = await res.json();
    return {
        url: data.secure_url as string,
        publicId: data.public_id as string, // Guarda esto si luego necesitas eliminar la imagen
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
    console.log("Signature:", signature);
    console.log("Timestamp:", timestamp);
    console.log("API Key:", apiKey);
    console.log("Cloud Name:", cloudName);

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







