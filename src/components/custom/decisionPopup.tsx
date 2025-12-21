// src/components/custom/decisionPopup.tsx

import { Button } from "../ui/button";

const DecisionPopup = ({
    question,
    yesText,
    noText,
    onYes,
    onNo,
}: {
    question: string;
    yesText: string | undefined;
    noText: string | undefined;
    onYes: () => void;
    onNo: () => void;
}) => {
    return (
        <div className="absolute z-50 w-72 rounded-lg bg-slate-800 text-slate-100 p-3 shadow-xl border border-slate-700 text-xs space-y-3">
            <p className="text-[12px] leading-snug">{question}</p>
            <div className="flex flex-row justify-between gap-3">
                <Button
                    type="button"
                    onClick={onYes}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium px-2 py-1 rounded-md"
                >
                    {yesText}
                </Button>
                <Button
                    type="button"
                    onClick={onNo}
                    variant="outline"
                    className="flex-1 border border-rose-500 text-rose-200 bg-rose-900/30 hover:bg-rose-900/60 text-xs font-medium px-2 py-1 rounded-md"
                >
                    {noText}
                </Button>
            </div>
        </div>
    );
};

export default DecisionPopup;

