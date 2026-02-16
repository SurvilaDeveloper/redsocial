// src/components/custom/MainMenuDesktop.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MAIN_MENU_ITEMS } from "./mainMenuConfig";
import { UserCog } from "lucide-react";

type BusinessMini = {
    id: number;
    name: string;
    slug: string;
};

type Props = {
    session: any;
};

export function MainMenuDesktop({ session }: Props) {
    const pathname = usePathname();

    const normalizedSession = useMemo(() => session?.session ?? session, [session]);
    const role = normalizedSession?.user?.role;

    const [businesses, setBusinesses] = useState<BusinessMini[]>([]);
    const [bizLoading, setBizLoading] = useState(false);
    const [bizError, setBizError] = useState<string | null>(null);
    const [selectedBizSlug, setSelectedBizSlug] = useState<string>("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setBizLoading(true);
            setBizError(null);

            try {
                const res = await fetch("/api/business/my", { method: "GET" });
                if (!res.ok) {
                    if (res.status === 401) {
                        // no logueado => no mostramos
                        if (!cancelled) setBusinesses([]);
                        return;
                    }
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();
                const list: BusinessMini[] = Array.isArray(data?.businesses) ? data.businesses : [];

                if (!cancelled) setBusinesses(list);
            } catch (e: any) {
                if (!cancelled) setBizError(e?.message ?? "Error cargando negocios");
            } finally {
                if (!cancelled) setBizLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const hasBusinesses = businesses.length > 0;

    return (
        <nav className="hidden lg:flex lg:flex-col gap-1 w-full text-sm">
            <h2 className="text-xs uppercase tracking-wide text-slate-400 mb-1 px-2">
                Menú
            </h2>

            {role === "admin" && (
                <Link
                    href={"/admin"}
                    className="text-slate-200 hover:bg-slate-800/70 hover:text-sky-100 flex flex-row items-center gap-2 rounded-md px-3 py-2 transition-colors"
                >
                    <UserCog className="w-4 h-4 shrink-0" />
                    Página de Administrador
                </Link>
            )}

            {/* ✅ Mis negocios (select) */}
            {hasBusinesses && (
                <div className="px-2 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">
                        Mis negocios
                    </div>

                    {bizLoading ? (
                        <div className="text-xs text-slate-400 px-1">Cargando...</div>
                    ) : bizError ? (
                        <div className="text-xs text-red-400 px-1">No se pudieron cargar.</div>
                    ) : (
                        <select
                            value={selectedBizSlug}
                            onChange={(e) => {
                                const slug = e.target.value;
                                setSelectedBizSlug(slug);
                                if (!slug) return;
                                window.location.href = `/b/${slug}`;
                            }}
                            className="w-full rounded-md bg-slate-900 border border-slate-700 text-slate-100 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-slate-600"
                        >
                            <option value="" disabled>
                                Ir a negocio público…
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

            {MAIN_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={[
                            "flex flex-row items-center gap-2 rounded-md px-3 py-2 transition-colors",
                            isActive
                                ? "bg-slate-800 text-sky-200"
                                : "text-slate-200 hover:bg-slate-800/70 hover:text-sky-100",
                        ].join(" ")}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default MainMenuDesktop;

