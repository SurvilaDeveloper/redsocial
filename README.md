# 🔐 Red Social – Plataforma de usuarios con foco en seguridad

Este proyecto es una **aplicación web construida con Next.js** orientada a la gestión de usuarios, autenticación y seguridad de cuenta, diseñada con criterios de **producto real** y no como un simple demo.

El foco principal está puesto en:
- seguridad
- claridad arquitectónica
- mantenibilidad
- buena experiencia de usuario

---

## 🧠 Idea general

La aplicación implementa funcionalidades típicas de una plataforma moderna de usuarios, pero con especial atención a **cómo** se implementan:

- Autenticación y sesiones
- Configuración de privacidad
- Gestión de dispositivos
- Acciones sensibles con confirmación por email
- Invalidación de sesiones
- Auditoría de eventos de seguridad

Muchas de estas decisiones están inspiradas en cómo funcionan productos reales (redes sociales, plataformas SaaS, etc.).

---

## 🧱 Stack tecnológico

- **Next.js (App Router)**
- **TypeScript**
- **NextAuth / auth custom**
- **Prisma ORM**
- **Base de datos relacional**
- **UI con componentes propios**
- **Email transaccional (confirmaciones de seguridad)**

---

## 🔐 Seguridad como feature

La seguridad no está tratada como un agregado, sino como una parte central del diseño.

Algunos ejemplos implementados:

- Gestión de **dispositivos confiables**
  - listado de otros dispositivos
  - revocación segura con confirmación por email
  - volver a confiar en un dispositivo revocado
- Tokens de un solo uso (one-time)
- Expiración de tokens
- Almacenamiento de hashes en lugar de valores crudos
- Invalidación global de sesiones (`sessionVersion`)
- Eventos de auditoría

---

## 🧭 Arquitectura

El proyecto está organizado con una separación clara entre:

- **UI**
  - páginas de cuenta
  - flujos de confirmación
- **API**
  - endpoints REST con responsabilidades bien definidas
- **Dominio**
  - dispositivos
  - sesiones
  - tokens
- **Documentación**
  - flujos sensibles explicados en `.md`

La intención es que cualquier persona que lea el código pueda **entender el flujo completo** sin necesidad de contexto externo.

---

## 📄 Documentación interna

Además de este README general, el repositorio incluye documentación específica para flujos críticos, por ejemplo:

- Gestión de dispositivos
- Revocación y confianza de accesos
- Decisiones de seguridad

Estas notas están pensadas para:
- mantenimiento a largo plazo
- evitar errores de diseño
- facilitar futuras extensiones

---

## 🤝 Forma de trabajo

Este proyecto se desarrolla de manera iterativa, analizando cada flujo antes de implementarlo.

Trabajo en conjunto con **ChatGPT como asistente técnico**, utilizándolo para:
- revisar decisiones de arquitectura
- detectar inconsistencias
- mejorar claridad del código
- documentar flujos complejos

Las decisiones finales, el código y el diseño general son propios, usando la herramienta como apoyo técnico y de revisión.

---

## 🚧 Estado del proyecto

El proyecto está en **desarrollo activo**.  
No es un producto terminado, sino una base sólida pensada para crecer.

---

## 📌 Objetivo

Este repositorio sirve como:
- proyecto personal serio
- demostración de criterio técnico
- base reutilizable para productos reales
- espacio de aprendizaje aplicado

---

Si llegaste hasta acá, gracias por tomarte el tiempo de revisar el proyecto 🙂


---
---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
