"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
            <SelectTrigger className="w-full">
                <SelectValue />
            </SelectTrigger>

            <SelectContent
                className="z-50 bg-black border shadow-md rounded-md"
            >
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>

        </Select>
    );
}
