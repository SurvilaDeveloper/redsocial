"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
    { label: "Overview", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Posts", href: "/admin/posts" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Ads", href: "/admin/ads" },
    { label: "Metrics", href: "/admin/metrics" },
    { label: "Settings", href: "/admin/settings" },
    { label: "Logs", href: "/admin/logs" },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-slate-800 p-4">
            <h2 className="mb-4 text-lg font-semibold">
                Admin
            </h2>

            <nav className="flex flex-col gap-1">
                {items.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                rounded px-3 py-2 text-sm
                ${active
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-300 hover:bg-slate-800/50"}
              `}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
