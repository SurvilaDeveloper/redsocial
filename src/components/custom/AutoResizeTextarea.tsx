//src/app/components/custom/AutoResizeTextarea.tsx
"use client";

import React, { useEffect, useRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

const AutoResizeTextarea: React.FC<Props> = ({ value, onChange, style, ...rest }) => {
    const ref = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // resetear altura para recálculo
        el.style.height = "0px";
        const scrollHeight = el.scrollHeight;
        el.style.height = scrollHeight + "px";
    }, [value]);

    return (
        <textarea
            {...rest}
            ref={ref}
            value={value}
            onChange={onChange}
            className="w-full min-h-5 rounded-md bg-neutral-900 text-gray-100 border border-neutral-700 px-2 outline-none focus:border-neutral-500 text-[12px]"
            style={{
                overflow: "hidden",
                resize: "none",
                ...style,
            }}
        />
    );
};

export default AutoResizeTextarea;
