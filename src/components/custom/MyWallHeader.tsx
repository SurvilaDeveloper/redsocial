// src/components/custom/MyWallHeader.tsx
"use client";

import { useMemo, useState } from "react";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type WallViewMode =
    | "owner"
    | "public"
    | "logged"
    | "followers_friends"
    | "friends";

const OPTIONS: { value: WallViewMode; label: string }[] = [
    { value: "owner", label: "Ver como yo" },
    { value: "public", label: "Ver como todo el mundo" },
    { value: "logged", label: "Ver como usuarios logueados" },
    { value: "followers_friends", label: "Ver como seguidores y amigos" },
    { value: "friends", label: "Ver como amigos" },
];

type Props = {
    value?: WallViewMode;
    onChange?: (next: WallViewMode) => void;
};

export function MyWallHeader({ value = "owner", onChange }: Props) {
    const [mode, setMode] = useState<WallViewMode>(value);

    const currentLabel = useMemo(
        () => OPTIONS.find((o) => o.value === mode)?.label ?? "Ver como yo",
        [mode]
    );

    function select(next: WallViewMode) {
        setMode(next);
        onChange?.(next);
    }

    return (
        <header className="w-full py-3 lg:py-4 border-b border-slate-800 mb-2">
            <div className="flex items-center justify-between max-w-[720px] mx-auto px-2 lg:px-0">
                <h1 className="text-lg lg:text-2xl font-semibold">Mi muro</h1>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="secondary"
                            className="gap-2"
                            aria-label="Cambiar modo de vista"
                        >
                            <span className="text-sm">{currentLabel}</span>
                            <ChevronDown className="h-4 w-4 opacity-80" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-72 bg-black">
                        <DropdownMenuLabel>Ver muro como…</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {OPTIONS.map((opt) => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => select(opt.value)}
                                className={opt.value === mode ? "font-semibold" : ""}
                            >
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
