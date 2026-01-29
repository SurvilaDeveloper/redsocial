// src/lib/text/plurals.ts
export function pluralRespuestas(n: number) {

    return n === 0 ? "Responder" : n === 1 ? "1 respuesta" : `${n} respuestas`;
}
