// src/components/cv/styles/CVFontsMenu.tsx
"use client";

import React from "react";
import { Type, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { CVStyleConfig, CVStyleElement } from "@/types/cvStyle";

const FONT_FAMILIES = ["sans-serif", "serif", "monospace", "cursive", "fantasy"] as const;
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px"] as const;

type Props = {
    disabled?: boolean;
    styleConfig: CVStyleConfig;
    onChange: (next: CVStyleConfig) => void;
    onDirty?: () => void;
    styleKeys: readonly CVStyleElement[];
};

export function CVFontsMenu({
    disabled,
    styleConfig,
    onChange,
    onDirty,
    styleKeys,
}: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    aria-label="Configuración de fuentes"
                    title="Configuración de fuentes"
                    className="
      h-9 w-11 px-2
      inline-flex items-center justify-center gap-1
      rounded-md
      border border-slate-700
      bg-slate-900
      hover:bg-slate-800
      text-slate-300
      disabled:opacity-50 disabled:pointer-events-none
      focus:outline-none focus:ring-1 focus:ring-slate-500
    "
                >
                    <Type className="h-4 w-4" />
                    <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </button>
            </DropdownMenuTrigger>


            <DropdownMenuContent
                align="start"
                sideOffset={10}
                className="w-[min(28rem,calc(100vw-1.5rem))] rounded-lg border border-slate-700 bg-slate-950 text-slate-100 shadow-xl p-4 space-y-4"
            >
                {/* Toggle showDocTitle */}
                <div className="flex items-center justify-between gap-3 rounded-md border border-slate-700 px-3 py-2">
                    <div className="text-sm">Mostrar título del documento</div>
                    <input
                        type="checkbox"
                        checked={styleConfig.showDocTitle}
                        onChange={(e) => {
                            onChange({ ...styleConfig, showDocTitle: e.target.checked });
                            onDirty?.();
                        }}
                        className="h-4 w-4 accent-emerald-500"
                    />
                </div>

                {/* Styles */}
                <div className="space-y-3">
                    {styleKeys.map((key) => (
                        <div key={key} className="flex items-center gap-2">
                            <div className="capitalize w-28 text-sm text-slate-300">{key}:</div>

                            <select
                                value={styleConfig[key].fontFamily}
                                onChange={(e) => {
                                    const fontFamily = e.target.value;
                                    onChange({
                                        ...styleConfig,
                                        [key]: { ...styleConfig[key], fontFamily },
                                    });
                                    onDirty?.();
                                }}
                                className="bg-slate-950 text-slate-100 border border-slate-700 px-2 py-1 rounded"
                            >
                                {FONT_FAMILIES.map((f) => (
                                    <option key={f} value={f}>
                                        {f}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={styleConfig[key].fontSize}
                                onChange={(e) => {
                                    const fontSize = e.target.value;
                                    onChange({
                                        ...styleConfig,
                                        [key]: { ...styleConfig[key], fontSize },
                                    });
                                    onDirty?.();
                                }}
                                className="bg-slate-950 text-slate-100 border border-slate-700 px-2 py-1 rounded"
                            >
                                {FONT_SIZES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="color"
                                value={styleConfig[key].color}
                                onChange={(e) => {
                                    const color = e.target.value;
                                    onChange({
                                        ...styleConfig,
                                        [key]: { ...styleConfig[key], color },
                                    });
                                    onDirty?.();
                                }}
                                className="h-8 w-10 cursor-pointer rounded border border-slate-700 bg-slate-950"
                                title="Color"
                                aria-label="Color"
                            />
                        </div>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
