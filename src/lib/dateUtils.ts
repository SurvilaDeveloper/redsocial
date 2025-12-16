export function formatDate(fechaStr: string): string {
    const fecha = new Date(fechaStr);

    const year = fecha.getUTCFullYear();
    const mounth = (fecha.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = fecha.getUTCDate().toString().padStart(2, "0");
    const hours = fecha.getUTCHours().toString().padStart(2, "0");
    const minutes = fecha.getUTCMinutes().toString().padStart(2, "0");
    const seconds = fecha.getUTCSeconds().toString().padStart(2, "0");

    return `${year}-${mounth}-${day} ${hours}:${minutes}:${seconds}`;
}
