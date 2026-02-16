// src/hooks/useInfiniteCursorFeed.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CursorFeedParseResult<T> = {
    items: T[];
    nextCursor: string | null;
};

type Options<T> = {
    enabled?: boolean;
    buildUrl: (cursor: string | null) => string;
    parse: (data: any) => CursorFeedParseResult<T>;
    getKey: (item: T) => string;

    autoStart?: boolean;
    rootMargin?: string;
    threshold?: number;
};

export function useInfiniteCursorFeed<T>(opts: Options<T>) {
    const {
        enabled = true,
        buildUrl,
        parse,
        getKey,
        autoStart = true,
        rootMargin = "200px 0px",
        threshold = 0.01,
    } = opts;

    const [items, setItems] = useState<T[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // trigger manual
    const [fetchNonce, setFetchNonce] = useState(0);

    // guards
    const isFetchingRef = useRef(false);

    // ✅ NUEVO: lock inmediato para evitar doble requestMore (autostart + observer)
    const requestLockRef = useRef(false);

    // ✅ cursor “source of truth” para evitar carreras
    const cursorRef = useRef<string | null>(null);

    // observer
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const wasIntersectingRef = useRef(false);

    // mantener ref sincronizado
    useEffect(() => {
        cursorRef.current = nextCursor;
    }, [nextCursor]);

    const reset = useCallback(() => {
        setItems([]);
        setNextCursor(null);
        setHasMore(true);
        setLoading(false);
        setFetchNonce(0);

        isFetchingRef.current = false;
        requestLockRef.current = false;
        cursorRef.current = null;
        wasIntersectingRef.current = false;
    }, []);

    const requestMore = useCallback(() => {
        if (!enabled) return;
        if (!hasMore) return;
        if (loading) return;
        if (isFetchingRef.current) return;

        // ✅ lock inmediato: si autostart + observer llaman casi a la vez, solo entra una
        if (requestLockRef.current) return;
        requestLockRef.current = true;

        setFetchNonce((n) => n + 1);
    }, [enabled, hasMore, loading]);

    // fetch (solo por fetchNonce)
    useEffect(() => {
        if (!enabled) {
            requestLockRef.current = false;
            return;
        }
        if (!hasMore) {
            requestLockRef.current = false;
            return;
        }
        if (isFetchingRef.current) return;

        isFetchingRef.current = true;
        setLoading(true);

        (async () => {
            try {
                const cursor = cursorRef.current; // ✅ siempre el último
                const url = buildUrl(cursor);

                //console.log('url:', url);

                const res = await fetch(url, { cache: "no-store" });
                const data = await res.json().catch(() => null);

                if (!res.ok || !data) {
                    setHasMore(false);
                    setNextCursor(null);
                    return;
                }

                const { items: incoming, nextCursor: serverNext } = parse(data);

                setNextCursor(serverNext);
                setHasMore(serverNext !== null);

                if (incoming?.length) {
                    setItems((prev) => {
                        const existing = new Set(prev.map(getKey));
                        const unique = incoming.filter((x) => !existing.has(getKey(x)));
                        return unique.length ? [...prev, ...unique] : prev;
                    });
                } else {
                    if (serverNext === null) setHasMore(false);
                }
            } finally {
                setLoading(false);
                isFetchingRef.current = false;

                // ✅ liberamos lock al final del fetch (siempre)
                requestLockRef.current = false;
            }
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchNonce]);

    // autostart
    useEffect(() => {
        if (!enabled) return;
        if (!autoStart) return;

        // ✅ solo si aún no hay items (evita autostart repetido cuando el componente rerenderiza)
        if (items.length === 0) requestMore();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, autoStart]);

    // observer (edge trigger)
    useEffect(() => {
        if (!enabled) return;
        if (!hasMore) return;

        observerRef.current?.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const e = entries[0];
                const now = Boolean(e?.isIntersecting);

                if (!now) {
                    wasIntersectingRef.current = false;
                    return;
                }

                const canLoadNow = enabled && hasMore && !loading && !isFetchingRef.current && !requestLockRef.current;

                // ✅ solo latch si realmente podemos cargar
                if (!wasIntersectingRef.current && canLoadNow) {
                    wasIntersectingRef.current = true;
                    requestMore();
                }
            },
            { root: null, rootMargin, threshold }
        );

        const el = sentinelRef.current;
        if (el) observerRef.current.observe(el);

        return () => observerRef.current?.disconnect();
    }, [enabled, hasMore, loading, requestMore, rootMargin, threshold]);

    const canLoadMore = useMemo(() => enabled && hasMore && !loading, [enabled, hasMore, loading]);

    return {
        items,
        setItems,
        loading,
        hasMore,
        canLoadMore,
        nextCursor,
        sentinelRef,
        requestMore,
        reset,
    };
}


