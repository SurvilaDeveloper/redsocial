"use client";

import { Button } from "../ui/button";
import { useState } from "react";

const FollowButton = ({
    userId,
    following,
    onclick,
}: {
    userId: number;
    following: boolean;
    onclick: () => void | Promise<void>
}) => {



    return (
        <>
            <Button onClick={onclick}>
                {!following && (
                    <span id="toFollowButton" className="userProfileMiniCardButton">
                        Seguir
                    </span>
                )}
            </Button>

            {following && (
                <span id="youFollowButton" className="userProfileMiniCardButton">
                    Le sigues
                </span>
            )}
        </>
    );
};

export default FollowButton;

