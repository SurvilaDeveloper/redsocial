// src/components/cv/dnd/SortableRow.tsx
"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Density = "default" | "compact";

type Props = {
    id: string;
    children: React.ReactNode;
    className?: string;
    headerRight?: React.ReactNode;
    title?: React.ReactNode;
    density?: Density;
    showHeader?: boolean;
};

export function SortableRow({
    id,
    children,
    className,
    headerRight,
    title,
    density = "default",
    showHeader = true,
}: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: "relative",
    };

    const isCompact = density === "compact";

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                // ✅ Root: NO overflow-hidden (así no recorta en el reordenamiento)
                "rounded-xl border border-slate-800 bg-slate-950/60",
                isDragging && "ring-2 ring-emerald-500/40 shadow-lg",
                className
            )}
        >
            {/* ✅ Inner wrapper: acá sí podés recortar si querés mantener estética */}
            <div className="rounded-xl overflow-hidden">
                {showHeader && (
                    <div
                        className={cn(
                            "flex items-center gap-2 border-b border-slate-800/70 bg-slate-950/40",
                            isCompact ? "px-2 py-1.5" : "px-3 py-2"
                        )}
                    >
                        <button
                            type="button"
                            className={cn(
                                "cursor-grab active:cursor-grabbing rounded-md",
                                "text-slate-300 hover:text-emerald-200 hover:bg-slate-900/60",
                                isCompact ? "p-1" : "p-1.5"
                            )}
                            {...attributes}
                            {...(listeners ?? {})}
                            aria-label="Arrastrar"
                            title="Arrastrar"
                        >
                            <GripVertical className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        </button>

                        <div className={cn("min-w-0 flex-1", isCompact && "text-[13px] leading-tight")}>
                            {title}
                        </div>

                        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
                    </div>
                )}

                <div className={cn(isCompact ? "p-2" : "p-3")}>{children}</div>
            </div>
        </div>
    );
}





