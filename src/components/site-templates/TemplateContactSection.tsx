// src/components/site-templates/TemplateContactSection.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

function isValidEmail(email: string) {
    const s = String(email || "").trim();
    if (s.length < 6 || s.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
}

type PreviewState = "idle" | "error" | "success";

export function TemplateContactSection({
    showHint = true,
    title,
    state: stateProp,
    simulateSubmit = true,
}: {
    state?: PreviewState;
    showHint?: boolean;
    title?: string;
    simulateSubmit?: boolean;
}) {
    const subjectPlaceholder = useMemo(() => title ?? "Consulta", [title]);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const isControlled = typeof stateProp === "string";
    const [pending, setPending] = useState(false);
    const [internalState, setInternalState] = useState<PreviewState>("idle");
    const state = isControlled ? (stateProp as PreviewState) : internalState;

    const canSend = !pending && isValidEmail(email) && message.trim().length > 0;

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isControlled) return;
        if (!simulateSubmit) return;

        if (email.trim().length > 0 && !isValidEmail(email)) {
            setInternalState("error");
            return;
        }
        if (!message.trim()) {
            setInternalState("error");
            return;
        }

        setInternalState("idle");
        setPending(true);

        window.setTimeout(() => {
            setPending(false);
            setInternalState("success");

            window.setTimeout(() => {
                setInternalState("idle");
            }, 2000);
        }, 900);
    }

    const labelStyle: React.CSSProperties = {
        color: "var(--t-co-lcr)",
        fontFamily: "var(--t-co-lty)",
        fontSize: "var(--t-co-ltse)" as any,
    };

    const inputStyle: React.CSSProperties = {
        color: "var(--t-co-icr)",
        background: "var(--t-co-ibgcr)",
        borderWidth: "var(--t-co-ibr)" as any,
        borderStyle: "solid",
        borderColor: "var(--t-co-ibcr)",
        borderRadius: "var(--t-co-irs)",
    };

    return (
        <Card
            className="p-5 rounded-2xl"
            style={{
                background: "var(--t-co-bgcr)",
                borderWidth: "var(--t-co-br)" as any,
                borderStyle: "solid",
                borderColor: "var(--t-co-bcr)",
                borderRadius: "var(--t-co-rs)",
            }}
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                {showHint && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--t-co-lcr)" }}>
                        <Info size={14} className="opacity-80" />
                        <span>Vista previa del formulario (no envía mensajes).</span>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs" style={labelStyle}>
                            Nombre (opcional)
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-10 px-3 text-sm outline-none"
                            placeholder="Tu nombre"
                            style={inputStyle}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs" style={labelStyle}>
                            Email
                        </label>
                        <input
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (!isControlled && state === "error") setInternalState("idle");
                            }}
                            className="h-10 px-3 text-sm outline-none"
                            placeholder="tu@email.com"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs" style={labelStyle}>
                        Asunto (opcional)
                    </label>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-10 px-3 text-sm outline-none"
                        placeholder={subjectPlaceholder}
                        style={inputStyle}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs" style={labelStyle}>
                        Mensaje
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            if (!isControlled && state === "error") setInternalState("idle");
                        }}
                        rows={6}
                        className="px-3 py-2 text-sm outline-none resize-none"
                        placeholder="Escribí tu mensaje..."
                        style={inputStyle}
                    />
                </div>

                {state === "error" && (
                    <div className="flex items-center gap-2 text-sm text-red-300">
                        <AlertCircle size={16} className="opacity-90" />
                        <span>Email inválido o mensaje vacío.</span>
                    </div>
                )}

                {state === "success" && (
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                        <CheckCircle2 size={16} className="opacity-90" />
                        <span>Enviado ✅</span>
                    </div>
                )}

                {/* ✅ Alineación “igual que CTA”: start/center/end */}
                <div className="mt-1 flex" style={{ justifyContent: "var(--t-co-btan)" as any }}>
                    <Button
                        type="submit"
                        disabled={simulateSubmit ? !canSend : false}
                        className="border text-sm"
                        style={{
                            background: "var(--t-co-btbg)",
                            borderWidth: "var(--t-co-btbr)" as any,
                            borderStyle: "solid",
                            borderColor: "var(--t-co-btbrcr)",
                            borderRadius: "var(--t-co-btrs)",
                            color: "var(--t-co-btcr)",
                            fontFamily: "var(--t-co-btty)",
                            fontSize: "var(--t-co-bttse)" as any,
                        }}
                    >
                        {pending ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send size={16} className="mr-2" />
                                Enviar
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <style jsx>{`
        input::placeholder,
        textarea::placeholder {
          color: var(--t-co-ipcr);
        }

        input:focus,
        textarea:focus {
          border-color: var(--t-co-ifcr);
        }

        button:hover {
          background: var(--t-co-btbgHv);
        }
      `}</style>
        </Card>
    );
}