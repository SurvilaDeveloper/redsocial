// src/components/custom/VisibilitySelect.tsx

"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Option {
    label: string;
    value: number;
}

interface VisibilitySelectProps {
    value: number;
    options: Option[];
    onChange: (value: number) => void;
}

export default function VisibilitySelect({
    value,
    options,
    onChange,
}: VisibilitySelectProps) {
    return (
        <Select
            value={String(value)}
            onValueChange={(v) => onChange(Number(v))}
        >
            {/* Trigger */}
            <SelectTrigger
                className={cn(
                    "w-full h-10 px-3",
                    "rounded-md",
                    "bg-slate-950 border border-slate-800",
                    "text-sm text-slate-200",
                    "hover:bg-slate-900/60 hover:border-slate-700",
                    "focus:ring-2 focus:ring-emerald-500/40",
                    "transition-all"
                )}
            >
                <SelectValue placeholder="Seleccionar visibilidad" />
            </SelectTrigger>

            {/* Dropdown */}
            <SelectContent
                className={cn(
                    "z-50",
                    "rounded-lg border border-slate-800",
                    "bg-slate-950 shadow-xl",
                    "p-1",
                    "animate-in fade-in zoom-in-95"
                )}
            >
                {options.map((opt) => (
                    <SelectItem
                        key={opt.value}
                        value={String(opt.value)}
                        className={cn(
                            "relative flex items-center",
                            "rounded-md py-2 pr-3 pl-8", // 👈 espacio para la tilde
                            "text-sm text-slate-200",
                            "cursor-pointer select-none",
                            "hover:bg-slate-900",
                            "focus:bg-emerald-500/10 focus:text-emerald-300",
                            "data-[state=checked]:bg-emerald-500/10",
                            "data-[state=checked]:text-emerald-300",
                            "transition"
                        )}
                    >
                        {opt.label}
                    </SelectItem>

                ))}
            </SelectContent>
        </Select>
    );
}

