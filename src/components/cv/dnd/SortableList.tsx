// src/components/cv/dnd/SortableList.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

type SortableListProps = {
    ids: string[];
    onMove: (fromIndex: number, toIndex: number) => void;
    children: React.ReactNode;

    /**
     * Opcional: ajustar qué tan sensible es el drag (px de movimiento).
     * Default 6.
     */
    activationDistance?: number;
};

export function SortableList({
    ids,
    onMove,
    children,
    activationDistance = 6,
}: SortableListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: activationDistance },
        })
    );

    const [activeId, setActiveId] = useState<string | null>(null);

    const onDragStart = (e: DragStartEvent) => {
        setActiveId(String(e.active.id));
    };

    const onDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;

        setActiveId(null);

        if (!over) return;
        if (active.id === over.id) return;

        const from = ids.indexOf(String(active.id));
        const to = ids.indexOf(String(over.id));
        if (from < 0 || to < 0) return;

        onMove(from, to);
    };

    const onDragCancel = () => setActiveId(null);

    // Overlay visual (simple): un “card” siguiendo el puntero.
    // Esto evita la sensación de “invisible” y se ve siempre arriba.
    const overlay = useMemo(() => {
        if (!activeId) return null;

        return (
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/90 px-3 py-2 shadow-xl">
                <div className="text-xs font-semibold text-emerald-200">
                    Moviendo…
                </div>
            </div>
        );
    }, [activeId]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
        >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>

            <DragOverlay dropAnimation={null}>{overlay}</DragOverlay>
        </DndContext>
    );
}


