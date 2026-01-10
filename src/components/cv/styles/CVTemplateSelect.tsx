// src/components/cv/styles/CVTemplateSelect.tsx
"use client";

import type { CVTemplateId } from "@/components/cv/renderers/CVRendererSwitch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";

import { LayoutGrid } from "lucide-react";

export function CVTemplateSelect({
    value,
    onChange,
}: {
    value: CVTemplateId;
    onChange: (next: CVTemplateId) => void;
}) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as CVTemplateId)}>
            <SelectTrigger
                aria-label="Cambiar template"
                title="Cambiar template"
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
                <LayoutGrid className="h-4 w-4 text-slate-300" />
            </SelectTrigger>

            <SelectContent className="bg-black">
                <SelectItem value="classic">Clásico</SelectItem>
                <SelectItem value="twoColumns">Dos columnas</SelectItem>
                <SelectItem value="compact">Compacto</SelectItem>
                <SelectItem value="modernSidebar">Sidebar</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="rightProfileAccent">Perfil a la derecha</SelectItem>
                <SelectItem value="ribbonTheme">Cinta</SelectItem>
            </SelectContent>
        </Select>
    );
}



