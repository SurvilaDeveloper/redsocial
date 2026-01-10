// src/components/cv/styles/CVThemeSelect.tsx
"use client";

import type { CVThemeColor } from "@/types/cvTheme";
import { TONES } from "@/types/cvTheme";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";

import { Palette } from "lucide-react";

const THEME_LABELS: Record<CVThemeColor, string> = {
    slate: "Slate",
    blue: "Blue",
    green: "Green",
    red: "Red",
    violet: "Violet",
    amber: "Amber",
};

export function CVThemeSelect({
    value,
    onChange,
}: {
    value: CVThemeColor;
    onChange: (next: CVThemeColor) => void;
}) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as CVThemeColor)}>
            <SelectTrigger
                aria-label="Cambiar color del tema"
                title="Cambiar color del tema"
                className="
          h-9 w-9 p-0
          flex items-center justify-center
          rounded-md
          border border-slate-700
          bg-slate-900
          hover:bg-slate-800
          focus:ring-1 focus:ring-slate-500
        "
            >
                <div className="relative h-9 w-9 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-slate-300" />

                    {/* mini dot color */}
                    <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ring-1 ring-black/40 bg-white">
                        <span className={`block h-full w-full rounded-full ${TONES[value].bg900}`} />
                    </span>
                </div>
            </SelectTrigger>

            <SelectContent className="bg-black">
                {(Object.keys(THEME_LABELS) as CVThemeColor[]).map((k) => (
                    <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${TONES[k].bg900}`} />
                            <span>{THEME_LABELS[k]}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
