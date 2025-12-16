import { Button } from "../ui/button";

const DecisionPopup = ({
    question,
    yesText,
    noText,
    onYes,
    onNo
}: {
    question: string;
    yesText: string | undefined;
    noText: string | undefined;
    onYes: () => void;
    onNo: () => void;
}) => {
    return (
        <div className="decisionPopup">
            <p>{question}</p>
            <div className="flex flex-row justify-between gap-4">
                <Button className="decisionPopupYesButton" onClick={onYes}>{yesText}</Button>
                <Button className="decisionPopupNoButton" onClick={onNo}>{noText}</Button>
            </div>
        </div>
    );
};

export default DecisionPopup;

