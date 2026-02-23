//src/components/business/BusinessContactSection.tsx
"use client";

import React, { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, AlertCircle, CheckCircle2 } from "lucide-react";

function isValidEmail(email: string) {
    const s = String(email || "").trim();
    if (s.length < 6 || s.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
}

export function BusinessContactSection({ businessSlug }: { businessSlug: string }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    // honeypot
    const [company, setCompany] = useState("");

    const [pending, startTransition] = useTransition();
    const [ok, setOk] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const canSend = isValidEmail(email) && message.trim().length > 0 && !pending;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setOk(false);
        setErr(null);

        if (!isValidEmail(email)) return setErr("Email inválido.");
        if (!message.trim()) return setErr("Escribí un mensaje.");

        startTransition(async () => {
            try {
                const res = await fetch(`/api/business/slug/${businessSlug}/contact`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        email,
                        subject,
                        message,
                        company, // honeypot
                    }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setErr(data?.error || "No se pudo enviar.");
                    return;
                }

                setOk(true);
                setName("");
                setEmail("");
                setSubject("");
                setMessage("");
                setCompany("");
            } catch (e) {
                setErr("Error de red. Probá de nuevo.");
            }
        });
    }

    return (
        <Card
            className="p-5 rounded-2xl"
            style={{
                background: "var(--b-co-bgcr)",
                borderWidth: "var(--b-co-br)" as any,
                borderStyle: "solid",
                borderColor: "var(--b-co-bcr)",
                borderRadius: "var(--b-co-rs)",

            }}
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label
                            className="text-xs"
                            style={{
                                color: "var(--b-co-lcr)",
                                fontFamily: "var(--b-co-lty)",
                                fontSize: "var(--b-co-ltse)" as any,
                            }}
                        >
                            Nombre (opcional)
                        </label>

                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-10 px-3 text-sm outline-none"
                            placeholder="Tu nombre"
                            style={{
                                color: "var(--b-co-icr)",
                                background: "var(--b-co-ibgcr)",
                                borderWidth: "var(--b-co-ibr)" as any,
                                borderStyle: "solid",
                                borderColor: "var(--b-co-ibcr)",
                                borderRadius: "var(--b-co-irs)",
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label
                            className="text-xs"
                            style={{
                                color: "var(--b-co-lcr)",
                                fontFamily: "var(--b-co-lty)",
                                fontSize: "var(--b-co-ltse)" as any,
                            }}
                        >
                            Email
                        </label>

                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-10 px-3 text-sm outline-none"
                            placeholder="tu@email.com"
                            style={{
                                color: "var(--b-co-icr)",
                                background: "var(--b-co-ibgcr)",
                                borderWidth: "var(--b-co-ibr)" as any,
                                borderStyle: "solid",
                                borderColor: "var(--b-co-ibcr)",
                                borderRadius: "var(--b-co-irs)",
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        className="text-xs"
                        style={{
                            color: "var(--b-co-lcr)",
                            fontFamily: "var(--b-co-lty)",
                            fontSize: "var(--b-co-ltse)" as any,
                        }}
                    >
                        Asunto (opcional)
                    </label>

                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-10 px-3 text-sm outline-none"
                        placeholder="Consulta"
                        style={{
                            color: "var(--b-co-icr)",
                            background: "var(--b-co-ibgcr)",
                            borderWidth: "var(--b-co-ibr)" as any,
                            borderStyle: "solid",
                            borderColor: "var(--b-co-ibcr)",
                            borderRadius: "var(--b-co-irs)",
                        }}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        className="text-xs"
                        style={{
                            color: "var(--b-co-lcr)",
                            fontFamily: "var(--b-co-lty)",
                            fontSize: "var(--b-co-ltse)" as any,
                        }}
                    >
                        Mensaje
                    </label>

                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="px-3 py-2 text-sm outline-none resize-none"
                        placeholder="Escribí tu mensaje..."
                        style={{
                            color: "var(--b-co-icr)",
                            background: "var(--b-co-ibgcr)",
                            borderWidth: "var(--b-co-ibr)" as any,
                            borderStyle: "solid",
                            borderColor: "var(--b-co-ibcr)",
                            borderRadius: "var(--b-co-irs)",
                        }}
                    />
                </div>

                {err && (
                    <div className="flex items-center gap-2 text-sm text-red-300">
                        <AlertCircle size={16} className="opacity-90" />
                        <span>{err}</span>
                    </div>
                )}

                {ok && (
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                        <CheckCircle2 size={16} className="opacity-90" />
                        <span>Enviado ✅</span>
                    </div>
                )}

                <div className="mt-1">
                    <Button
                        type="submit"
                        disabled={!canSend}
                        className="rounded-xl border text-sm"
                        style={{
                            background: "var(--b-co-btbg)",
                            borderWidth: "var(--b-co-btbr)" as any,
                            borderStyle: "solid",
                            borderColor: "var(--b-co-btbrcr)",
                            borderRadius: "var(--b-co-btrs)",
                            color: "var(--b-co-btcr)",
                            fontFamily: "var(--b-co-btty)",
                            fontSize: "var(--b-co-bttse)" as any,
                            alignSelf:
                                (getComputedStyle(document.documentElement).getPropertyValue("--b-co-btan").trim() as any) === "center"
                                    ? "center"
                                    : (getComputedStyle(document.documentElement).getPropertyValue("--b-co-btan").trim() as any) === "end"
                                        ? "flex-end"
                                        : "flex-start",
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
          color: var(--b-co-ipcr);
        }
        input:focus,
        textarea:focus {
          border-color: var(--b-co-ifcr);
        }
      `}</style>
        </Card>
    );
}
