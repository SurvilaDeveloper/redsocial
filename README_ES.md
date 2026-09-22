# RedSocial — Plataforma Full-Stack

[English](README.md)

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)
![Estado](https://img.shields.io/badge/estado-desarrollo%20activo-orange)

**RedSocial** es una aplicación web Full-Stack multi-módulo desarrollada con **Next.js, React, TypeScript, Prisma y MySQL/MariaDB**.

El proyecto comenzó como una red social y evolucionó hacia una plataforma más amplia que combina:

- cuentas de usuario y flujos de sesión orientados a seguridad
- perfiles sociales, muros, publicaciones y relaciones
- privacidad y reglas de visibilidad
- gestión de imágenes/media
- editor configurable de CV
- publicaciones de productos y servicios
- mini-sitios públicos para negocios de los usuarios
- área administrativa
- modelos experimentales de intereses y perfil productivo

El alcance amplio es parte del objetivo técnico: mostrar cómo distintos dominios de producto pueden convivir sobre una misma capa de identidad, permisos y persistencia.

> **Estado:** proyecto personal en desarrollo activo. Muchos flujos importantes son funcionales, mientras que otras áreas siguen siendo experimentales o están en construcción. Debe evaluarse como proyecto de ingeniería Full-Stack y no como una red social lista para producción.

---

## Capturas

<p align="center">
  <img src="public/home.png" alt="Vista principal de RedSocial" width="820">
</p>

<p align="center">
  <img src="public/wall.jpg" alt="Muro de usuario de RedSocial" width="820">
</p>

<p align="center">
  <img src="public/newpost.png" alt="Creación de publicación en RedSocial" width="820">
</p>

---

## Puntos destacados para portfolio

El código demuestra trabajo en distintas áreas Full-Stack:

- arquitectura App Router de Next.js
- React 19 + TypeScript
- autenticación con Auth.js / NextAuth
- login con credenciales y Google OAuth
- hashing de contraseñas con bcrypt
- sesiones basadas en JWT
- Prisma ORM con MySQL/MariaDB
- Server Actions y Route Handlers
- control de acceso por roles
- invalidación de sesiones mediante `sessionVersion`
- seguimiento y revocación de dispositivos
- verificación de email y confirmación de acciones sensibles
- reglas de privacidad y visibilidad
- relaciones sociales: follows y amistades
- publicaciones, muros, compartir, fijar, comentarios y reacciones
- flujos de media con Cloudinary
- editor configurable de CV con varios layouts
- publicación pública/privada de CV
- preview imprimible / exportable como PDF
- publicaciones de productos y servicios
- mini-sitios de negocios creados por usuarios
- navegación, páginas y temas editables
- templates reutilizables para negocios
- formularios públicos de contacto
- herramientas administrativas de gestión de usuarios
- modelos experimentales de intereses y perfil profesional por keywords

---

## Stack tecnológico

### Aplicación

- **Next.js 15**
- **React 19**
- **TypeScript 5**
- Tailwind CSS
- Radix UI
- Lucide React
- `dnd-kit`

### Backend / datos

- **Prisma 7**
- MySQL / MariaDB
- Auth.js / NextAuth
- bcryptjs
- Zod

### Integraciones

- Cloudinary
- Resend
- Google OAuth

### Otros

- html2canvas
- jsPDF
- ua-parser-js

---

## Arquitectura general

```text
┌───────────────────────────────────────────┐
│              Aplicación Next.js          │
│                                           │
│ Server Components / Client Components    │
│ Server Actions / Route Handlers           │
└────────────────────┬──────────────────────┘
                     │
          ┌──────────┼───────────────┐
          │          │               │
          ▼          ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌────────────────┐
│ Auth /       │ │ Plataforma   │ │ Módulos        │
│ seguridad    │ │ social       │ │ productivos    │
│              │ │              │ │                │
│ sesiones     │ │ posts        │ │ editor CV      │
│ dispositivos │ │ muros        │ │ listings       │
│ roles        │ │ amistades    │ │ sitios negocio │
│ emails       │ │ followers    │ │ templates      │
└──────┬───────┘ └──────┬───────┘ └────────┬───────┘
       │                │                   │
       └────────────────┼───────────────────┘
                        ▼
                 ┌─────────────┐
                 │   Prisma    │
                 │ MySQL /     │
                 │ MariaDB     │
                 └─────────────┘

Servicios externos:
- Cloudinary → media
- Resend     → email
- Google     → OAuth
```

---

# Cuentas y autenticación

La plataforma permite autenticación mediante:

- email + contraseña
- Google OAuth

Las contraseñas creadas mediante credenciales se guardan con hash **bcrypt**.

Las sesiones utilizan estrategia JWT e incorporan información propia de la aplicación:

```text
id de usuario
rol
sessionVersion
estado activo
imagen de perfil
```

El proyecto mantiene distintos roles:

```text
novice
user
premium
shop
server
moderator
admin
```

---

## Verificación de email

El registro mediante credenciales crea un flujo de verificación de email con tokens que expiran.

Flujo general:

```text
Registrar cuenta
      ↓
Crear token de verificación
      ↓
Enviar enlace
      ↓
Validar token / expiración
      ↓
Marcar email como verificado
```

> Actualmente la capa de email está configurada para desarrollo/pruebas y redirige los emails salientes a una dirección provisoria. Debe modificarse antes de utilizarla en producción.

---

# Invalidación de sesiones

Un mecanismo central es:

```text
sessionVersion
```

La versión se incluye dentro de la sesión.

Distintas acciones sensibles pueden incrementar el valor persistido en la base de datos, haciendo inválidas las sesiones anteriores.

Actualmente este mecanismo interviene en flujos como:

- revocación de dispositivos
- cambio de contraseña
- logout forzado por administrador
- activación/desactivación de cuentas

Las navegaciones protegidas pueden comprobar la versión actual mediante una consulta interna firmada.

---

## Validación firmada de `sessionVersion`

El middleware y el endpoint de validación intercambian headers firmados que contienen:

```text
id del usuario
timestamp
método HTTP
path del endpoint
```

La autenticación interna utiliza **HMAC-SHA256** e incluye una ventana temporal para reducir riesgo de replay.

Un cookie firmado de corta duración permite reutilizar temporalmente una validación reciente y evita consultar la base de datos en cada navegación protegida.

---

# Dispositivos reconocidos

La aplicación mantiene una lista de dispositivos reconocidos por usuario.

La identidad actual de dispositivo es un **fingerprint aproximado de navegador / sistema operativo / tipo de dispositivo**, derivado del user-agent y hasheado con SHA-256.

No busca ser una identidad de hardware.

Los flujos actuales incluyen:

- registrar un dispositivo nuevo
- actualizar último uso
- listar otros dispositivos
- marcar un dispositivo como revocado
- bloquear login desde dispositivos revocados
- volver a confiar en un dispositivo
- registrar eventos de seguridad

---

## Revocación con confirmación por email

Revocar un dispositivo es una operación en varios pasos.

```text
Usuario autenticado solicita revocación
              ↓
Generar token aleatorio one-time
              ↓
Guardar únicamente SHA-256 del token
              ↓
Enviar enlace de confirmación
              ↓
Validar token + expiración
              ↓
Revocar dispositivo
              ↓
Incrementar sessionVersion
              ↓
Eliminar token
              ↓
Registrar evento de seguridad
```

El token de revocación expira a los 15 minutos.

Existe documentación técnica específica en:

```text
docs/SECURITY_DEVICES_FLOW.md
```

---

# Cambio de contraseña

El cambio de contraseña también funciona como una acción confirmada.

El flujo verifica la contraseña actual, genera el hash bcrypt de la nueva contraseña y crea una solicitud con expiración.

Al confirmarla:

- se reemplaza la contraseña
- se incrementa `sessionVersion`
- se invalidan otras solicitudes pendientes
- se registra un evento de seguridad

> Esta área forma parte del trabajo de hardening del proyecto y no debe interpretarse como software de autenticación auditado profesionalmente.

---

# Privacidad y permisos

La configuración del usuario controla la visibilidad de distintas partes de la cuenta:

- información de perfil
- imagen de perfil y portada
- muro
- publicaciones
- comentarios y respuestas
- media
- listas de amigos / seguidores
- likes e interacciones

Las decisiones pueden depender de si quien observa es:

```text
anónimo
usuario autenticado
seguidor
seguido por el usuario
amigo
propietario
```

La visibilidad del post y la de la entrada del muro se verifican de forma independiente.

---

# Plataforma social

La capa social contiene varios sistemas de relaciones y contenido.

## Relaciones

Los usuarios pueden:

- seguir / dejar de seguir
- enviar solicitudes de amistad
- aceptar o rechazar solicitudes
- cancelar solicitudes enviadas
- eliminar amistades

El flujo de amistad evita generar filas duplicadas ante solicitudes repetidas.

---

## Publicaciones y muros

La plataforma contempla:

- creación y edición de publicaciones
- imágenes
- muros de usuarios
- inclusión en feed
- publicaciones compartidas
- publicaciones fijadas
- soft delete / papelera
- reglas de visibilidad
- paginación por cursor

El feed usa eventos del muro que pueden representar:

```text
PUBLISHED
SHARED
PINNED
```

mientras evita devolver el mismo post más de una vez dentro de una respuesta.

---

## Comentarios, respuestas y reacciones

El modelo y las APIs contemplan:

- comentarios
- respuestas
- likes
- reacciones negativas / unlikes
- reacciones sobre imágenes
- reacciones sobre comentarios y respuestas
- reportes de contenido

El estado de reacción y los conteos se manejan de forma que la UI pueda conocer tanto la reacción del usuario actual como los totales.

---

# Media

Cloudinary se utiliza en distintos flujos:

- imagen de perfil
- imagen de muro
- imágenes de publicaciones
- media del CV
- media de productos
- media de servicios
- imágenes de sitios de negocios

Algunos flujos procesan la imagen antes de subirla.

> Los endpoints de media todavía están siendo consolidados y revisados. Antes de un despliegue público debe verificarse que todas las rutas de escritura/upload tengan autenticación, autorización y límites de abuso adecuados.

---

# Editor de CV

Uno de los módulos grandes de la plataforma es un editor configurable de currículum.

Permite crear secciones como:

- perfil
- experiencia
- educación
- habilidades
- idiomas
- proyectos
- secciones personalizadas

También incluye:

- ordenamiento drag-and-drop
- tipografías configurables
- temas de color
- imagen de encabezado
- estado público/privado
- preview
- impresión / descarga como PDF

Existen varios renderers visuales, entre ellos:

```text
Classic
Compact
Modern Sidebar
Timeline
Ribbon
Right Profile Accent
```

Los CV públicos pueden exponerse mediante rutas asociadas al usuario.

---

# Productos y servicios

El proyecto incluye un modelo tipo marketplace para:

- publicaciones de productos
- publicaciones de servicios
- imágenes/media
- comentarios
- reacciones
- visibilidad
- precio y moneda

Los listings pertenecen al usuario y también pueden vincularse a uno o más negocios.

De esta forma el contenido comercial se mantiene separado del sitio donde se lo presenta.

---

# Mini-sitios para negocios

Los usuarios pueden crear espacios públicos configurables para sus negocios.

El Studio actual incluye:

- identidad del negocio y slug
- estado / activación
- personalización del header
- navegación
- páginas editables
- secciones de inicio
- configuración visual
- aplicación de templates
- integración con productos/servicios
- formulario público de contacto

Cada negocio tiene una ruta pública:

```text
/b/<slug>
```

El editor y el renderer público están separados, permitiendo persistir la configuración independientemente de los componentes visuales.

---

## Templates reutilizables

El repositorio contiene templates para distintas categorías, por ejemplo:

```text
carpintería
construcción
inmobiliaria
fotografía
gimnasio
pizzería
odontología
psicología
electricista
desarrollo
ropa deportiva
instrumentos
clases de inglés
```

Los templates pueden definir:

- imagen de encabezado
- navegación
- secciones
- galerías
- productos/servicios de ejemplo
- configuración visual

---

## Formulario de contacto

Los sitios de negocio pueden mostrar un formulario público.

La implementación actual incluye:

- validación de entrada
- honeypot básico anti-spam
- rate limit token-bucket en memoria
- escape HTML de valores enviados por el usuario
- `replyTo` para facilitar respuesta al visitante

> El rate limiter es solamente best-effort porque vive en memoria del proceso. Un despliegue distribuido debería utilizar Redis/KV u otro almacenamiento compartido.

---

# Administración

Existe un área administrativa protegida por rol `admin`.

El módulo más desarrollado es la **gestión de usuarios**, que incluye:

- listado paginado
- búsqueda amplia
- filtro por rol
- filtro activo/inactivo
- detalle del usuario
- cambio de rol
- activación/desactivación
- logout forzado mediante `sessionVersion`

Hay validaciones para impedir varias modificaciones peligrosas sobre el propio administrador u otros administradores.

Otras secciones como métricas, reportes y logs existen actualmente principalmente como scaffolding y no se presentan como módulos terminados.

---

# Perfiles de intereses y productividad

También existen modelos experimentales que construyen perfiles mediante keywords.

## Perfil de intereses

La aplicación puede registrar señales como:

```text
view
like
own_post
```

y combinarlas con keywords previamente extraídas de publicaciones.

El perfil resultante almacena puntuaciones ponderadas por keyword.

## Perfil productivo

Otro perfil agrega información profesional desde fuentes como:

```text
CV
perfil
educación
comercio
tags del usuario
```

Cada fuente y tipo de keyword recibe distintos pesos.

Estos sistemas son experimentales y no se presentan como modelos de Machine Learning.

---

# Modelo de datos

El schema de Prisma cubre varios dominios:

```text
Usuarios / Accounts
Dispositivos
Logs de seguridad
Solicitudes de cambio de contraseña
Perfil / privacidad
Amistades / follows
Posts / entradas de muro
Comentarios / respuestas
Media
Reacciones
Reportes
CV / media del CV
Perfiles de intereses
Keywords profesionales
Productos / servicios
Negocios / páginas de negocios
```

La amplitud de este modelo relacional es una de las principales partes de ingeniería del proyecto.

---

# Estructura del proyecto

```text
redsocial/
├── docs/
│   └── SECURITY_DEVICES_FLOW.md
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── home.png
│   ├── wall.jpg
│   ├── newpost.png
│   └── templates/
│
├── src/
│   ├── actions/
│   ├── app/
│   │   ├── api/
│   │   ├── studio/
│   │   └── ...
│   ├── components/
│   │   ├── admin/
│   │   ├── business/
│   │   ├── cv/
│   │   └── ...
│   ├── lib/
│   │   ├── auth/
│   │   ├── business/
│   │   ├── interests/
│   │   ├── productive/
│   │   └── ...
│   └── types/
│
├── src/auth.ts
├── src/auth.config.ts
└── package.json
```

---

# Desarrollo local

## Requisitos

- Node.js / npm
- base MySQL o MariaDB
- cuenta Cloudinary para funcionalidades de media
- configuración Resend para emails
- credenciales Google OAuth si se habilita login con Google

Clonar:

```bash
git clone https://github.com/SurvilaDeveloper/redsocial.git
cd redsocial
```

Instalar:

```bash
npm install
```

Crear un archivo local:

```text
.env
```

Usar `.env.example` como referencia.

Generar Prisma Client:

```bash
npx prisma generate
```

Aplicar el schema/migraciones según la configuración local de la base.

Iniciar:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

---

# Variables de entorno

La aplicación utiliza variables como:

```env
AUTH_SECRET=
DATABASE_URL=
AUTH_RESEND_KEY=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Nunca se deben subir credenciales o secretos reales al repositorio.**

---

# Limitaciones actuales

El repositorio sigue en desarrollo.

Entre las limitaciones actuales:

- todavía no existe una suite de tests automatizados
- no hay un workflow CI mantenido
- los emails actualmente se redirigen a una dirección provisoria de pruebas
- algunas secciones admin son placeholders
- el rate limiting en memoria no es apropiado para despliegues con varias instancias
- algunas rutas de media/upload todavía requieren consolidación y revisión de seguridad
- el proyecto no fue sometido a una auditoría independiente de seguridad
- no hay un deployment de producción documentado en este repositorio

---

# Próximos pasos

Mejoras de alto valor:

- agregar tests automatizados de autenticación y autorización
- testear invalidación de sesiones y revocación de dispositivos
- agregar tests de permisos sociales
- reemplazar el envío provisional de emails por configuración real por entorno
- consolidar y proteger endpoints de upload
- mover rate limiting a Redis / Upstash / KV compartido
- revisar CSRF y abuso en acciones sensibles
- agregar CI para lint, tests y build
- documentar mejor migraciones y seed de base
- agregar capturas del CV Builder, Business Studio y administración
- definir una licencia para el repositorio
- desplegar una demo segura para portfolio

---

## Autor

**Gabriel Survila**

GitHub: [SurvilaDeveloper](https://github.com/SurvilaDeveloper)
