// src/app/(protected)/admin/users/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SearchParams = {
    q?: string;
    role?: string;
    active?: string; // "1" | "0" | ""
    page?: string;
};

const PAGE_SIZE = 20;

function toInt(v: string | undefined, fallback: number) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function buildQueryString(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v && v.trim() !== "") sp.set(k, v);
    }
    const s = sp.toString();
    return s ? `?${s}` : "";
}

// Campos a incluir en la búsqueda "amplia"
function buildUserSearchOR(query: string) {
    // Si el query es un número, también buscamos por id exacto
    const queryAsNumber = Number(query);
    const maybeId =
        Number.isFinite(queryAsNumber) && query.trim() !== ""
            ? [{ id: queryAsNumber }]
            : [];

    return [
        ...maybeId,

        // Identidad principal
        { name: { contains: query } },
        { nick: { contains: query } },
        { email: { contains: query } },

        // Contacto / perfil
        { phoneNumber: { contains: query } },
        { movilNumber: { contains: query } },
        { bio: { contains: query } },
        { website: { contains: query } },

        // Ubicación
        { location: { contains: query } },
        { city: { contains: query } },
        { province: { contains: query } },
        { country: { contains: query } },

        // Trabajo
        { occupation: { contains: query } },
        { company: { contains: query } },

        // Handles
        { twitterHandle: { contains: query } },
        { facebookHandle: { contains: query } },
        { instagramHandle: { contains: query } },
        { linkedinHandle: { contains: query } },
        { githubHandle: { contains: query } },
    ];
}

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const { q, role, active, page } = await searchParams;

    const query = (q ?? "").trim();
    const roleFilter = (role ?? "").trim();
    const activeFilter = (active ?? "").trim(); // "1" | "0" | ""

    const currentPage = clamp(toInt(page, 1) || 1, 1, 10_000);
    const skip = (currentPage - 1) * PAGE_SIZE;

    // where
    const where: any = {
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(activeFilter === "1" || activeFilter === "0"
            ? { active: Number(activeFilter) }
            : {}),
        ...(query ? { OR: buildUserSearchOR(query) } : {}),
    };

    const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip,
            take: PAGE_SIZE,
            select: {
                id: true,
                name: true,
                nick: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                lastLogin: true,
            },
        }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const prevPage = Math.max(1, currentPage - 1);
    const nextPage = Math.min(totalPages, currentPage + 1);

    const baseParams = {
        q: query || undefined,
        role: roleFilter || undefined,
        active: activeFilter || undefined,
    };

    return (
        <div className="p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold">Admin · Users</h1>
                <p className="mt-1 text-sm text-slate-400">
                    Total: <span className="text-slate-200">{total}</span>
                </p>
            </header>

            {/* Filtros */}
            <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                <form className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1">
                        <label className="mb-1 block text-xs text-slate-400">Buscar</label>
                        <input
                            name="q"
                            defaultValue={query}
                            placeholder="Nombre, nick, email, id, teléfono, ubicación..."
                            className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-slate-600"
                        />
                    </div>

                    <div className="w-full md:w-56">
                        <label className="mb-1 block text-xs text-slate-400">Rol</label>
                        <select
                            name="role"
                            defaultValue={roleFilter}
                            className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                        >
                            <option value="">Todos</option>
                            <option value="novice">novice</option>
                            <option value="user">user</option>
                            <option value="premium">premium</option>
                            <option value="server">server</option>
                            <option value="shop">shop</option>
                            <option value="moderator">moderator</option>
                            <option value="admin">admin</option>
                        </select>
                    </div>

                    <div className="w-full md:w-40">
                        <label className="mb-1 block text-xs text-slate-400">Activo</label>
                        <select
                            name="active"
                            defaultValue={activeFilter}
                            className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                        >
                            <option value="">Todos</option>
                            <option value="1">Activos</option>
                            <option value="0">Inactivos</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-white"
                    >
                        Aplicar
                    </button>

                    <Link
                        href="/admin/users"
                        className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
                    >
                        Limpiar
                    </Link>
                </form>
            </div>

            {/* Tabla */}
            <div className="overflow-hidden rounded-lg border border-slate-800">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-900/60">
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                            <th className="px-4 py-3">Usuario</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3">Activo</th>
                            <th className="px-4 py-3">Creado</th>
                            <th className="px-4 py-3">Último login</th>
                            <th className="px-4 py-3">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="bg-slate-950">
                        {users.length === 0 ? (
                            <tr>
                                <td className="px-4 py-6 text-sm text-slate-400" colSpan={7}>
                                    No hay usuarios con esos filtros.
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className="border-t border-slate-900">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-slate-100">
                                            {u.name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            @{u.nick ?? "—"} · ID: {u.id}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-200">{u.email}</td>

                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-200">
                                            {u.role ?? "user"}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-300">
                                        {u.active === 1 ? "Sí" : "No"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-400">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleString("es-AR") : "—"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-400">
                                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString("es-AR") : "—"}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/admin/users/${u.id}`}
                                                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                                            >
                                                Ver
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <div>
                    Página <span className="text-slate-100">{currentPage}</span> de{" "}
                    <span className="text-slate-100">{totalPages}</span>
                </div>

                <div className="flex gap-2">
                    <Link
                        href={"/admin/users" + buildQueryString({ ...baseParams, page: String(prevPage) })}
                        className={`rounded-md border border-slate-700 px-3 py-1.5 hover:bg-slate-900 ${currentPage === 1 ? "pointer-events-none opacity-40" : ""
                            }`}
                    >
                        Anterior
                    </Link>

                    <Link
                        href={"/admin/users" + buildQueryString({ ...baseParams, page: String(nextPage) })}
                        className={`rounded-md border border-slate-700 px-3 py-1.5 hover:bg-slate-900 ${currentPage === totalPages ? "pointer-events-none opacity-40" : ""
                            }`}
                    >
                        Siguiente
                    </Link>
                </div>
            </div>
        </div>
    );
}

