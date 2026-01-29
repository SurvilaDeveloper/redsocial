// src/components/custom/ConfigurationSelect.tsx

"use client";
import * as React from "react";
import { SelectNumberField } from "@/components/inputs";

interface Option {
    label: string;
    value: number;
}

interface ConfigurationSelectProps {
    value: number;
    options: Option[];
    onChange: (value: number) => void;
}

export default function ConfigurationSelect({
    value,
    options,
    onChange,
}: ConfigurationSelectProps) {

    return (
        <SelectNumberField
            value={value}
            onValueChange={(v) => {
                if (v == null) return;
                onChange(v);
            }}
            options={options.map((o) => ({
                label: o.label,
                value: String(o.value),
            }))}
            placeholder="Seleccionar visibilidad"
            height="40px"
            width="100%"
        />
    );
}