// src/components/custom/followButton.tsx
"use client";

import { Button } from "../ui/button";

const FollowButton = ({
    userId,
    following,
    onclick,
}: {
    userId: number;
    following: boolean;
    onclick: () => void | Promise<void>;
}) => {
    const baseChip =
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] leading-none whitespace-nowrap";

    return (
        <div className="flex items-center gap-1">
            {!following && (
                <Button
                    type="button"
                    onClick={onclick}
                    variant="ghost"
                    className="p-0 bg-transparent hover:bg-transparent"
                >
                    <span
                        className={
                            baseChip +
                            " border-slate-300 text-slate-100 bg-slate-900/40 hover:bg-slate-800"
                        }
                    >
                        Seguir
                    </span>
                </Button>
            )}

            {following && (
                <span
                    className={
                        baseChip +
                        " border-emerald-400 text-emerald-200 bg-emerald-900/40"
                    }
                >
                    Le sigues
                </span>
            )}
        </div>
    );
};

export default FollowButton;


