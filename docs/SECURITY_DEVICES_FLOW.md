# 🔐 Flujo de Seguridad: Gestión de Dispositivos

Este documento describe el flujo completo de **gestión de dispositivos asociados a una cuenta**:
- listado de dispositivos
- revocación segura con confirmación por email
- volver a confiar en un dispositivo revocado

El objetivo del diseño es **evitar accesos no autorizados**, **no romper la sesión actual** y mantener **trazabilidad de seguridad**.

---

## 🧠 Conceptos clave

### Trusted Device
Cada inicio de sesión registra (o reutiliza) un `trustedDevice` que representa:
- un navegador / dispositivo
- asociado a un usuario
- identificado por un `deviceHash` (derivado principalmente del user-agent)

Un dispositivo puede estar en uno de dos estados:
- **Activo** → `revokedAt = null`
- **Revocado** → `revokedAt != null`

---

## 🗂️ Endpoints involucrados

| Endpoint | Método | Propósito |
|--------|--------|----------|
| `/api/security/devices` | GET | Listar *otros dispositivos* del usuario |
| `/api/security/devices/request-disable` | POST | Iniciar revocación (envía email) |
| `/api/security/devices/disable` | POST | Confirmar revocación (token) |
| `/api/security/devices/:id/trust` | POST | Volver a confiar en un dispositivo |
| `/security/devices/disable` | Page | UI de confirmación desde email |

---

## 📋 1. Listado de dispositivos

### Endpoint GET /api/security/devices


### ¿Quién lo usa?
- UI: `/editaccount` → pestaña **“Otros dispositivos”**

### Comportamiento
- Obtiene todos los `trustedDevice` del usuario autenticado.
- **Excluye el dispositivo actual** usando `deviceHash`.
  - Evita que el usuario se revoque a sí mismo desde la misma sesión.
- Ordena por `lastUsedAt` descendente.

### Respuesta
La API devuelve datos listos para UI:
- id
- nombre amigable (`browser en OS`)
- tipo de dispositivo (`desktop | mobile | tablet`)
- fechas (`lastUsedAt`, `createdAt`)
- estado (`revoked`)

---

## 🛑 2. Revocar un dispositivo (flujo seguro)

Revocar un dispositivo es una **acción sensible**, por lo que **no se ejecuta directamente** desde la UI.

---

### Paso 1 – Solicitud de revocación

#### Endpoint POST /api/security/devices/request-disable
Body: { deviceId }


#### ¿Quién lo llama?
- UI: `/editaccount` → botón **“Revocar”**

#### Qué hace
- Valida que el usuario esté autenticado.
- Verifica que el `deviceId` pertenezca al usuario.
- Genera un **token one-time** con expiración (15 minutos).
- Guarda **solo el hash** del token en la base de datos.
- Envía un email de confirmación al usuario.

🚫 **En este paso NO se revoca el dispositivo**.

---

### Paso 2 – Email de confirmación

El email contiene un link del tipo: /security/devices/disable?token=XXX


El token:
- es de un solo uso
- expira automáticamente
- nunca se guarda en texto plano

---

### Paso 3 – Página de confirmación (UI)

#### Página /security/devices/disable

#### Qué hace
- Lee el `token` desde la URL.
- Llama a: POST /api/security/devices/disable
Body: { token }

- Muestra feedback visual:
- Procesando
- Éxito
- Error (token inválido, expirado o ya utilizado)

---

### Paso 4 – Revocación real (backend)

#### Endpoint POST /api/security/devices/disable
Body: { token }


#### Qué hace
- Valida el token (hash + expiración).
- Revoca el dispositivo (`revokedAt = now`).
- Invalida sesiones activas del usuario:
  - `user.sessionVersion++`
- Elimina el token (one-time).
- Registra un evento de seguridad (`DEVICE_DISABLED`).

✅ **La revocación se completa en este paso**.

---

## 🔁 3. Volver a confiar en un dispositivo

A diferencia de la revocación, **volver a confiar** es una acción menos sensible.

---

### Endpoint POST /api/security/devices/:id/trust

### ¿Quién lo llama?
- UI: `/editaccount` → botón **“Confiar”**

### Comportamiento
- Requiere sesión válida.
- Verifica que:
  - el dispositivo pertenezca al usuario
  - el dispositivo esté revocado
- Actualiza:
  - `revokedAt = null`
  - `lastUsedAt = now`

📌 **No utiliza email ni tokens**.

---

## 🔐 Decisiones de seguridad

- ✔️ Revocar requiere confirmación por email.
- ✔️ Tokens:
  - one-time
  - con expiración
  - almacenados como hash.
- ✔️ Las sesiones activas se invalidan al revocar.
- ✔️ El dispositivo actual no se muestra en la lista.
- ✔️ Se registran eventos de seguridad.

---

## 🧭 Flujo visual (simplificado)

EditAccount UI
|
|-- GET /api/security/devices
|
|-- POST request-disable (deviceId)
|
|-- Email
|
|-- /security/devices/disable?token
|
|-- POST /api/security/devices/disable
|
|-- revoke + logout


---

## ✅ Estado actual

- Flujo activo: **B (UI + POST)**.
- No hay endpoints huérfanos activos.
- Código documentado en puntos críticos.
- Arquitectura clara, segura y mantenible.

---



