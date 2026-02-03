// src/components/search/SearchResultsList.tsx
"use client";

import { SearchUserRow, Mode } from "./types";
import UserResultCard from "./UserResultCard";
import SearchSkeleton from "./SearchSkeleton";
import SearchEmptyState from "./SearchEmptyState";

export default function SearchResultsList(props: {
    items: SearchUserRow[];
    loading: boolean;
    query: string;
    mode: Mode;
    onPatchItem: (userId: number, patch: Partial<SearchUserRow>) => void;
}) {
    const { items, loading, query, mode, onPatchItem } = props;

    if (loading) return <SearchSkeleton />;

    if (query.trim().length < 2) {
        return <div className="text-sm text-slate-400">Escribí al menos 2 caracteres.</div>;
    }

    if (items.length === 0) {
        return <SearchEmptyState q={query.trim()} mode={mode} />;
    }

    return (
        <div className="space-y-2">
            {items.map((u) => (
                <UserResultCard
                    key={u.id}
                    user={u}
                    query={query}
                    onPatch={(patch) => onPatchItem(u.id, patch)}
                />
            ))}
        </div>
    );
}

