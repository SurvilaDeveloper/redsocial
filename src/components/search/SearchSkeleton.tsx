//src/components/search/SearchSkeleton.tsx
"use client";

export default function SearchSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-3 flex gap-3 animate-pulse"
                >
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 bg-slate-900 rounded" />
                        <div className="h-3 w-1/2 bg-slate-900 rounded" />
                        <div className="h-3 w-1/3 bg-slate-900 rounded" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-8 w-16 bg-slate-900 rounded-xl" />
                        <div className="h-8 w-16 bg-slate-900 rounded-xl" />
                        <div className="h-8 w-28 bg-slate-900 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}
