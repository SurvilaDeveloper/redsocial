// src/components/search/SearchUsersClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SearchUserRow } from "./types";
import SearchFilters from "./SearchFilters";
import SearchResultsList from "./SearchResultsList";
import type { Mode } from "./types";


export default function SearchUsersClient({ viewerId }: { viewerId: number }) {
    const [q, setQ] = useState("");
    const [mode, setMode] = useState<Mode>("all");
    const [onlyWithCV, setOnlyWithCV] = useState(false);

    const [rows, setRows] = useState<SearchUserRow[]>([]);
    const [loading, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // debounce simple
    const debounceRef = useRef<number | null>(null);

    const canSearch = useMemo(() => q.trim().length >= 2, [q]);

    async function runSearch(nextQ: string, nextMode: Mode, nextOnlyWithCV: boolean) {
        const query = nextQ.trim();
        if (query.length < 2) {
            setRows([]);
            setError(null);
            return;
        }

        setError(null);

        const params = new URLSearchParams({
            q: query,
            mode: nextMode,
            onlyWithCV: nextOnlyWithCV ? "1" : "0",
        });

        const res = await fetch(`/api/search/users?${params.toString()}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            const j = await res.json().catch(() => null);
            throw new Error(j?.error ?? "Error buscando usuarios");
        }

        const data = (await res.json()) as { items: SearchUserRow[] };
        setRows(data.items || []);
    }

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);

        debounceRef.current = window.setTimeout(() => {
            startTransition(() => {
                runSearch(q, mode, onlyWithCV).catch((e) => setError(e.message));
            });
        }, 300);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [q, mode, onlyWithCV]);

    return (
        <div className="space-y-3">
            <SearchFilters
                q={q}
                onQChange={setQ}
                mode={mode}
                onModeChange={setMode}
                onlyWithCV={onlyWithCV}
                onOnlyWithCVChange={setOnlyWithCV}
                loading={loading}
            />

            {!canSearch && (
                <div className="text-sm text-slate-400">
                    Escribí al menos <span className="text-slate-200">2 caracteres</span>.
                </div>
            )}

            {error && (
                <div className="text-sm text-red-400 border border-red-400/40 bg-red-950/30 rounded-xl p-3">
                    {error}
                </div>
            )}
            <SearchResultsList
                items={rows}
                loading={loading}
                query={q}
                mode={mode}
                onPatchItem={(userId, patch) => {
                    setRows((prev) =>
                        prev.map((it) => (it.id === userId ? { ...it, ...patch } : it))
                    );
                }}
            />

        </div>
    );
}
