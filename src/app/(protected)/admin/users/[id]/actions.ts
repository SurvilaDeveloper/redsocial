// src/app/(protected)/admin/users/[id]/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

export async function updateUserRoleAction(userId: number, nextRole: UserRole) {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const sessionUserId = Number(session.user.id);

    // No permitir cambiar tu propio rol
    if (sessionUserId === userId) {
        throw new Error("No podés cambiar tu propio rol.");
    }

    if (!Object.values(UserRole).includes(nextRole)) {
        throw new Error("Rol inválido.");
    }

    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    if (!target) {
        throw new Error("Usuario no encontrado.");
    }

    if (target.role === UserRole.admin) {
        throw new Error("No se puede cambiar el rol de un administrador.");
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role: nextRole },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
}

export async function setUserActiveAction(userId: number, nextActive: 0 | 1) {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const sessionUserId = Number(session.user.id);
    if (sessionUserId === userId) {
        throw new Error("No podés desactivarte a vos mismo.");
    }

    if (nextActive !== 0 && nextActive !== 1) {
        throw new Error("Valor inválido.");
    }

    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, active: true },
    });

    if (!target) throw new Error("Usuario no encontrado.");

    // Misma filosofía de seguridad: no tocar admins por error
    if (target.role === UserRole.admin) {
        throw new Error("No se puede desactivar/activar un administrador.");
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            active: nextActive,
            sessionVersion: { increment: 1 }, // ✅ fuerza logout inmediato
        },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    // ✅ (3) devolvemos el estado real aplicado
    return { active: nextActive };
}

export async function forceLogoutAction(userId: number) {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const sessionUserId = Number(session.user.id);

    // No permitir forzar tu propio logout (opcional, pero consistente)
    if (sessionUserId === userId) {
        throw new Error("No podés forzar tu propio logout.");
    }

    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    if (!target) throw new Error("Usuario no encontrado.");

    // Misma filosofía: no tocar admins por error
    if (target.role === UserRole.admin) {
        throw new Error("No se puede forzar logout a un administrador.");
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            sessionVersion: { increment: 1 }, // ✅ invalida sesiones existentes
        },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { ok: true };
}
