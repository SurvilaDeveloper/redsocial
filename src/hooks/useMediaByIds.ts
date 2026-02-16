//src/hooks/useMediaByIds.ts
"use client";

import * as React from "react";

type MediaItem = { id: number; url: string; publicId: string };
export type MediaMap = Record<number, MediaItem>;

export function useMediaByIds(ids: number[]) {
    const [map, setMap] = React.useState<MediaMap>({});
    const [loading, setLoading] = React.useState(false);

    const key = React.useMemo(() => {
        const uniq = Array.from(new Set(ids)).sort((a, b) => a - b);
        return uniq.join(",");
    }, [ids]);

    React.useEffect(() => {
        const uniq = key
            ? key.split(",").map((s) => Number(s)).filter((n) => Number.isFinite(n) && n > 0)
            : [];

        if (uniq.length === 0) return;

        let alive = true;

        (async () => {
            try {
                setLoading(true);

                // ✅ GET recomendado
                const res = await fetch(`/api/media/by-ids?ids=${uniq.join(",")}`, { cache: "no-store" });
                const data = await res.json().catch(() => ({}));

                if (!res.ok) return;

                const items = (data.items ?? []) as MediaItem[];

                const next: MediaMap = {};
                for (const it of items) next[it.id] = it;

                if (alive) setMap((prev) => ({ ...prev, ...next }));
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [key]);

    return { mediaMap: map, loading };
}
