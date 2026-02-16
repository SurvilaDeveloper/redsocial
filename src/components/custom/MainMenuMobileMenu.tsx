// src/components/custom/MainMenuMobileMenu.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MAIN_MENU_ITEMS } from "./mainMenuConfig";
import { MoreVertical, X, UserCog } from "lucide-react";
import Link from "next/link";

type BusinessMini = {
    id: number;
    name: string;
    slug: string;
};

type Props = {
    // Soporta tu forma actual (a veces viene como { session: {...} } y a veces directo)
    session: any;
};

export function MainMenuMobileMenu({ session }: Props) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Normalizamos: a veces usás session.session.user.role
    const normalizedSession = useMemo(() => session?.session ?? session, [session]);
    const role = normalizedSession?.user?.role;

    const [businesses, setBusinesses] = useState<BusinessMini[]>([]);
    const [bizLoading, setBizLoading] = useState(false);
    const [bizError, setBizError] = useState<string | null>(null);
    const [selectedBizSlug, setSelectedBizSlug] = useState<string>("");

    const toggleMenu = () => setOpen((v) => !v);

    const handleNavigate = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    // Cargar negocios cuando se abre el menú (y solo una vez)
    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!open) return;
            if (businesses.length > 0) return; // ya cargado

            setBizLoading(true);
            setBizError(null);

            try {
                const res = await fetch("/api/business/my", { method: "GET" });
                if (!res.ok) {
                    // si no está logueado, 401; no mostramos nada
                    if (res.status === 401) {
                        if (!cancelled) setBusinesses([]);
                        return;
                    }
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();
                const list: BusinessMini[] = Array.isArray(data?.businesses) ? data.businesses : [];

                if (!cancelled) {
                    setBusinesses(list);
                    // default: si hay 1+, dejamos placeholder vacío y el user elige
                }
            } catch (e: any) {
                if (!cancelled) {
                    setBizError(e?.message ?? "Error cargando negocios");
                }
            } finally {
                if (!cancelled) setBizLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const hasBusinesses = businesses.length > 0;

    const handleBusinessSelect = (slug: string) => {
        setSelectedBizSlug(slug);
        setOpen(false);

        // sitio público
        window.location.href = `/b/${slug}`;
    };

    return (
        <div className="lg:hidden relative">
            {/* Botón tres puntitos */}
            <button
                type="button"
                onClick={toggleMenu}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
            >
                {open ? <X className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
            </button>

            {/* Menú desplegable */}
            {open && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-slate-700 rounded-md shadow-lg z-50">
                    <div className="py-1">
                        <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-slate-400">
                            Menú
                        </div>

                        {role === "admin" && (
                            <Link
                                href={"/admin"}
                                className="text-slate-200 hover:bg-slate-800/70 hover:text-sky-100 flex flex-row items-center gap-2 rounded-md px-3 py-2 transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <UserCog className="w-4 h-4 shrink-0" />
                                Página de Administrador
                            </Link>
                        )}

                        {/* ✅ Mis negocios (select) */}
                        {hasBusinesses && (
                            <div className="px-3 py-2">
                                <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">
                                    Mis negocios
                                </div>

                                {bizLoading ? (
                                    <div className="text-xs text-slate-400">Cargando...</div>
                                ) : bizError ? (
                                    <div className="text-xs text-red-400">No se pudieron cargar.</div>
                                ) : (
                                    <select
                                        value={selectedBizSlug}
                                        onChange={(e) => {
                                            const slug = e.target.value;
                                            if (!slug) return;
                                            handleBusinessSelect(slug);
                                        }}
                                        className="w-full rounded-md bg-slate-900 border border-slate-700 text-slate-100 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
                                    >
                                        <option value="" disabled>
                                            Elegí un negocio…
                                        </option>
                                        {businesses.map((b) => (
                                            <option key={b.id} value={b.slug}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Items normales */}
                        {MAIN_MENU_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/" && pathname?.startsWith(item.href));

                            return (
                                <button
                                    key={item.href}
                                    type="button"
                                    onClick={() => handleNavigate(item.href)}
                                    className={[
                                        "w-full flex flex-row items-center gap-2 px-3 py-2 text-sm text-left",
                                        isActive
                                            ? "bg-slate-800 text-sky-200"
                                            : "text-slate-200 hover:bg-slate-800/80 hover:text-sky-100",
                                    ].join(" ")}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MainMenuMobileMenu;

