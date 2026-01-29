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
        "inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] leading-none whitespace-nowrap";


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
                            " border-slate-800 text-slate-400 bg-black hover:bg-slate-800"
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
                        " border-emerald-800 text-emerald-500 bg-black"
                    }
                >
                    Le sigues
                </span>
            )}
        </div>
    );
};

export default FollowButton;


