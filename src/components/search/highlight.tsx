//src/components/search/highlight.tsx
"use client";

function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function Highlight({
    text,
    query,
    className = "bg-yellow-400/20 text-yellow-200 rounded px-1",
}: {
    text?: string | null;
    query: string;
    className?: string;
}) {
    const t = text ?? "";
    const q = query.trim();
    if (!t || q.length < 2) return <>{t}</>;

    const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
    const parts = t.split(re);

    return (
        <>
            {parts.map((p, i) =>
                i % 2 === 1 ? (
                    <mark key={i} className={className}>
                        {p}
                    </mark>
                ) : (
                    <span key={i}>{p}</span>
                )
            )}
        </>
    );
}
