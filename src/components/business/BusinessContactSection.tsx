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
        <Card className="bg-black border-slate-800 p-5 rounded-2xl">
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                {/* Honeypot invisible */}
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
                        <label className="text-xs text-slate-300">Nombre (opcional)</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-10 rounded-xl bg-black border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                            placeholder="Tu nombre"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-300">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-10 rounded-xl bg-black border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                            placeholder="tu@email.com"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-300">Asunto (opcional)</label>
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-10 rounded-xl bg-black border border-slate-800 px-3 text-sm outline-none focus:border-slate-600"
                        placeholder="Consulta"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-300">Mensaje</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="rounded-xl bg-black border border-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-600 resize-none"
                        placeholder="Escribí tu mensaje..."
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
                        className="rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/20"
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
        </Card>
    );
}
