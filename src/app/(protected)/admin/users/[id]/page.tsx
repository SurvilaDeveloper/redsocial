// src/app/(protected)/admin/users/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RoleEditor from "./RoleEditor";
import ActiveToggle from "./ActiveToggle";
import { UserRole } from "@prisma/client";
import ForceLogoutButton from "./ForceLogoutButton";

function toIntId(id: string) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

function fmtDate(v?: Date | null) {
    if (!v) return "—";
    return new Date(v).toLocaleString("es-AR");
}

export default async function AdminUserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const userId = toIntId(id);
    if (!userId) return notFound();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            nick: true,
            email: true,
            name: true,
            role: true,
            active: true,
            visibility: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,

            // Perfil / contacto
            bio: true,
            phoneNumber: true,
            movilNumber: true,
            birthday: true,
            location: true,
            country: true,
            province: true,
            city: true,
            street: true,
            number: true,
            department: true,
            mail_code: true,
            website: true,
            language: true,
            occupation: true,
            company: true,

            // Redes
            twitterHandle: true,
            facebookHandle: true,
            instagramHandle: true,
            linkedinHandle: true,
            githubHandle: true,

            // Seguridad / estado
            emailVerified: true,
            twoFactorEnabled: true,
            lastLogin: true,
            failedLoginAttempts: true,
            sessionVersion: true,

            // Imágenes
            imageUrl: true,
            imagePublicId: true,
            imageWallUrl: true,
            imageWallPublicId: true,
            wallHeaderBackgroundColor: true,
            wallHeaderBackgroundType: true,

            // Contadores rápidos (sin traer listas)
            _count: {
                select: {
                    posts: true,
                    comments: true,
                    followers: true,
                    following: true,
                    productListings: true,
                    curricula: true,
                    curriculumMedias: true,
                    trustedDevices: true,
                    securityLogs: true,
                },
            },
        },
    });

    if (!user) return notFound();

    const address = [
        user.street,
        user.number,
        user.department ? `Dpto ${user.department}` : null,
        user.city,
        user.province,
        user.country,
        user.mail_code ? `CP ${user.mail_code}` : null,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Admin · User</h1>
                    <p className="mt-1 text-sm text-slate-400">
                        ID: <span className="text-slate-200">{user.id}</span>
                    </p>
                </div>

                <div className="flex gap-2">
                    <Link
                        href="/admin/users"
                        className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
                    >
                        Volver
                    </Link>

                    {/* Futuro: acciones */}
                    {/* <button className="rounded-md bg-red-500/20 border border-red-500/40 px-4 py-2 text-sm text-red-200">Suspender</button> */}
                </div>
            </div>

            {/* Resumen */}
            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Identidad
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="text-lg font-semibold text-slate-100">{user.name}</div>
                        <div className="text-sm text-slate-300">@{user.nick ?? "—"}</div>
                        <div className="text-sm text-slate-300">{user.email}</div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-200">
                            role: {user.role ?? "user"}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-200">
                            active: {user.active === 1 ? "sí" : "no"}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-200">
                            2FA: {user.twoFactorEnabled ? "on" : "off"}
                        </span>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Actividad
                    </div>

                    <dl className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Posts</dt>
                            <dd className="text-slate-100">{user._count.posts}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Comentarios</dt>
                            <dd className="text-slate-100">{user._count.comments}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Followers</dt>
                            <dd className="text-slate-100">{user._count.followers}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Following</dt>
                            <dd className="text-slate-100">{user._count.following}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Listings</dt>
                            <dd className="text-slate-100">{user._count.productListings}</dd>
                        </div>
                    </dl>

                    <div className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-400">
                        Último login: <span className="text-slate-200">{fmtDate(user.lastLogin)}</span>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                        Timestamps / Estado
                    </div>

                    <dl className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Creado</dt>
                            <dd className="text-slate-100">{fmtDate(user.createdAt)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Actualizado</dt>
                            <dd className="text-slate-100">{fmtDate(user.updatedAt)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Email verificado</dt>
                            <dd className="text-slate-100">{fmtDate(user.emailVerified)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">DeletedAt</dt>
                            <dd className="text-slate-100">{fmtDate(user.deletedAt)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">SessionVersion</dt>
                            <dd className="text-slate-100">{user.sessionVersion}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Failed logins</dt>
                            <dd className="text-slate-100">{user.failedLoginAttempts ?? 0}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Detalles (2 columnas) */}
            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <h2 className="text-sm font-semibold text-slate-200">Perfil</h2>

                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Bio</dt>
                            <dd className="text-slate-100 text-right max-w-[70%]">
                                {user.bio ?? "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Cumpleaños</dt>
                            <dd className="text-slate-100">{fmtDate(user.birthday)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Idioma</dt>
                            <dd className="text-slate-100">{user.language ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Ocupación</dt>
                            <dd className="text-slate-100">{user.occupation ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Empresa</dt>
                            <dd className="text-slate-100">{user.company ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Website</dt>
                            <dd className="text-slate-100">
                                {user.website ? (
                                    <a
                                        className="text-slate-200 underline decoration-slate-600 hover:decoration-slate-200"
                                        href={user.website}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {user.website}
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <h2 className="text-sm font-semibold text-slate-200">Contacto / Ubicación</h2>

                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Teléfono</dt>
                            <dd className="text-slate-100">{user.phoneNumber ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Móvil</dt>
                            <dd className="text-slate-100">{user.movilNumber ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Location</dt>
                            <dd className="text-slate-100">{user.location ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Dirección</dt>
                            <dd className="text-slate-100 text-right max-w-[70%]">
                                {address || "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Visibilidad</dt>
                            <dd className="text-slate-100">{user.visibility ?? 1}</dd>
                        </div>
                    </dl>
                </section>

                <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <h2 className="text-sm font-semibold text-slate-200">Redes</h2>

                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        {[
                            ["Twitter", user.twitterHandle],
                            ["Facebook", user.facebookHandle],
                            ["Instagram", user.instagramHandle],
                            ["LinkedIn", user.linkedinHandle],
                            ["GitHub", user.githubHandle],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-4">
                                <dt className="text-slate-400">{label}</dt>
                                <dd className="text-slate-100">{value ?? "—"}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <h2 className="text-sm font-semibold text-slate-200">Medios / Header</h2>

                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Avatar URL</dt>
                            <dd className="text-slate-100 text-right max-w-[70%]">
                                {user.imageUrl ?? "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Avatar PublicId</dt>
                            <dd className="text-slate-100 text-right max-w-[70%]">
                                {user.imagePublicId ?? "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Wall URL</dt>
                            <dd className="text-slate-100 text-right max-w-[70%]">
                                {user.imageWallUrl ?? "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Wall PublicId</dt>
                            <dd className="text-slate-100 text-right max-w-[70%]">
                                {user.imageWallPublicId ?? "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Header type</dt>
                            <dd className="text-slate-100">{user.wallHeaderBackgroundType ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-slate-400">Header color</dt>
                            <dd className="text-slate-100">{user.wallHeaderBackgroundColor ?? "—"}</dd>
                        </div>
                    </dl>
                </section>
            </div>
            <RoleEditor
                userId={user.id}
                currentRole={user.role}
                isAdminTarget={user.role === UserRole.admin}
            />
            <ActiveToggle
                userId={user.id}
                currentActive={user.active}
                isAdminTarget={user.role === UserRole.admin}
            />
            <ForceLogoutButton
                userId={user.id}
                isAdminTarget={user.role === UserRole.admin}
            />

            {/* Debug opcional (si querés) */}
            {/* <pre className="mt-6 overflow-auto rounded-md border border-slate-800 bg-slate-950 p-4 text-slate-100">
        {JSON.stringify(user, null, 2)}
      </pre> */}
        </div>
    );
}

