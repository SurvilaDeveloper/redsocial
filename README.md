# RedSocial — Full-Stack Social Platform

[Español](README_ES.md)

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1)
![Status](https://img.shields.io/badge/status-active%20development-orange)

**RedSocial** is a multi-module full-stack web application built with **Next.js, React, TypeScript, Prisma and PostgreSQL**.

It started as a social-network project and evolved into a broader platform that combines:

- user accounts and security-oriented session flows
- social profiles, walls, posts and relationships
- privacy and visibility rules
- media handling
- a configurable CV / résumé builder
- product and service listings
- public mini-sites for user-owned businesses
- an administration area
- experimental user-interest and productive-profile models

The project is intentionally broad: its main value is demonstrating how several product domains can coexist around a shared identity, permissions and persistence layer.

> **Status:** active personal project. Several major flows are functional, while other areas are still experimental or under construction. It should be evaluated as a full-stack engineering project rather than a production-ready social network.

---

## Screenshots

<p align="center">
  <img src="public/home.png" alt="RedSocial home view" width="820">
</p>

<p align="center">
  <img src="public/wall.jpg" alt="RedSocial user wall" width="820">
</p>

<p align="center">
  <img src="public/newpost.png" alt="RedSocial new post flow" width="820">
</p>

---

## Portfolio highlights

The codebase currently demonstrates work across several full-stack areas:

- Next.js App Router architecture
- React 19 + TypeScript
- Auth.js / NextAuth authentication
- credentials login and Google OAuth
- bcrypt password hashing
- JWT-based sessions
- Prisma ORM with PostgreSQL
- server actions and REST-style route handlers
- role-based access control
- account/session invalidation through a `sessionVersion`
- trusted-device tracking and revocation flows
- email verification and sensitive-action confirmation flows
- privacy / visibility rules
- social graphs: following and friendships
- posts, walls, sharing, pinning, comments and reactions
- Cloudinary-backed media workflows
- configurable CV builder with multiple layouts
- public/private CV publishing
- printable / PDF-ready CV preview
- product and service listings
- user-created business mini-sites
- editable business navigation, pages and visual themes
- reusable business-site templates
- public business contact forms
- administration tools for user management
- experimental keyword-based interest and professional-profile aggregation

---

## Technology stack

### Application

- **Next.js 15**
- **React 19**
- **TypeScript 5**
- Tailwind CSS
- Radix UI
- Lucide React
- `dnd-kit`

### Backend / data

- **Prisma 7**
- PostgreSQL
- Auth.js / NextAuth
- bcryptjs
- Zod

### Integrations

- Cloudinary
- Resend
- Google OAuth

### Other

- html2canvas
- jsPDF
- ua-parser-js

---

## High-level architecture

```text
┌───────────────────────────────────────────┐
│              Next.js application         │
│                                           │
│  Server Components / Client Components   │
│  Server Actions / Route Handlers          │
└────────────────────┬──────────────────────┘
                     │
          ┌──────────┼───────────────┐
          │          │               │
          ▼          ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌────────────────┐
│ Auth /       │ │ Social       │ │ Productive     │
│ Security     │ │ platform     │ │ modules        │
│              │ │              │ │                │
│ sessions     │ │ posts        │ │ CV builder     │
│ devices      │ │ walls        │ │ listings       │
│ roles        │ │ friends      │ │ business sites │
│ email flows  │ │ followers    │ │ templates      │
└──────┬───────┘ └──────┬───────┘ └────────┬───────┘
       │                │                   │
       └────────────────┼───────────────────┘
                        ▼
                 ┌─────────────┐
                 │   Prisma    │
                 │ PostgreSQL  │
                 │             │
                 └─────────────┘

External services:
- Cloudinary → media
- Resend     → email flows
- Google     → OAuth
```

---

# Account and authentication

The platform supports authentication using:

- email + password
- Google OAuth

Passwords created through the credentials flow are hashed with **bcrypt**.

User sessions use the JWT strategy and include application-specific information such as:

```text
user id
role
sessionVersion
active state
profile image
```

The project also maintains role values including:

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

## Email verification

Credential-based registration creates an email-verification flow with expiring tokens.

The general flow is:

```text
Register account
      ↓
Create verification token
      ↓
Send verification link
      ↓
Validate token / expiration
      ↓
Mark email as verified
```

> The current email layer is configured for development/testing and redirects outgoing mail to a provisional address. It must be changed before production use.

---

# Session invalidation

A central security mechanism is the user's:

```text
sessionVersion
```

The version is embedded in the session token.

Sensitive account actions can increment the database value, making older sessions invalid.

This mechanism is currently used by flows such as:

- device revocation
- password change
- administrator force logout
- account activation/deactivation

Protected document requests validate the current version through a signed server-to-server check.

---

## Signed session-version validation

The middleware and session-version endpoint exchange signed headers containing:

```text
user id
timestamp
HTTP method
endpoint path
```

The request is authenticated with **HMAC-SHA256** and includes a timestamp window to reduce replay risk.

A short-lived signed cookie caches recent validation results to avoid querying the database on every protected navigation.

---

# Trusted devices

The application keeps a per-user list of recognized devices.

The current device identity is a **coarse browser / OS / device-type fingerprint**, derived from the user agent and hashed with SHA-256.

This is not intended to be a hardware-level device identity.

Device-management flows include:

- registering a newly seen device
- updating last-use metadata
- listing other devices
- marking a device as revoked
- preventing login from a revoked device
- restoring trust
- recording security events

---

## Device revocation by email confirmation

Device revocation is intentionally a multi-step operation.

```text
Authenticated user requests revocation
              ↓
Generate one-time random token
              ↓
Store only SHA-256 hash of that token
              ↓
Send confirmation link
              ↓
Validate token + expiration
              ↓
Revoke device
              ↓
Increment sessionVersion
              ↓
Delete one-time token
              ↓
Write security event
```

The revocation token expires after 15 minutes.

Technical documentation for the flow is available at:

```text
docs/SECURITY_DEVICES_FLOW.md
```

---

# Password-change flow

Changing a password is also handled as a confirmed action.

The flow verifies the existing password, hashes the new password with bcrypt and creates a time-limited confirmation request.

After confirmation:

- the password is replaced
- `sessionVersion` is incremented
- other outstanding requests are invalidated
- a security event is recorded

> This area is still part of the project's security hardening work and should not be interpreted as independently audited authentication software.

---

# Privacy and permissions

User configuration controls visibility for different parts of an account, including:

- profile information
- profile and cover images
- wall
- posts
- comments and replies
- media
- friend / follower lists
- likes and interactions

Visibility decisions can depend on whether the viewer is:

```text
anonymous
authenticated
following the user
followed by the user
a friend
the owner
```

Post and wall-entry visibility are checked independently.

---

# Social platform

The social layer includes several relationship and content systems.

## Relationships

Users can:

- follow / unfollow another user
- send friendship requests
- accept or reject requests
- cancel outgoing requests
- remove friendships

Friendship creation is designed so repeated requests do not create duplicate relationship rows.

---

## Posts and walls

The platform includes:

- post creation and editing
- image media
- user walls
- feed visibility
- shared posts
- pinned wall entries
- soft deletion / trash flows
- post visibility rules
- cursor-based feed pagination

The feed uses wall-entry events so a post can represent events such as:

```text
PUBLISHED
SHARED
PINNED
```

while still avoiding duplicate post output in a single feed response.

---

## Comments, replies and reactions

The data model and APIs support interactions such as:

- post comments
- comment replies
- likes
- negative reactions / unlikes
- image reactions
- reactions on comments and replies
- content reports

The project keeps reaction state and aggregate counts separately so the client can display both the viewer's own reaction and totals.

---

# Media

Cloudinary is used for several image/media workflows, including:

- profile images
- wall images
- post images
- CV media
- product-listing media
- service-listing media
- business-site images

Some flows process images before upload.

> Media endpoints are still being consolidated and security-reviewed. Production deployment should ensure that every write/upload route has the expected authentication, authorization and quota/rate-limit controls.

---

# CV / résumé builder

A substantial module of the platform is a configurable CV editor.

Users can create a structured résumé with sections such as:

- profile
- experience
- education
- skills
- languages
- projects
- custom sections

The editor also supports:

- drag-and-drop ordering
- configurable typography
- color themes
- header image
- public/private state
- preview mode
- print / PDF workflow

Multiple renderer layouts are present, including variants such as:

```text
Classic
Compact
Modern Sidebar
Timeline
Ribbon
Right Profile Accent
```

Public CVs can be exposed through user-specific routes.

---

# Product and service listings

The project includes a marketplace-style content model for:

- product listings
- service listings
- images/media
- comments
- reactions
- visibility
- pricing and currency

Listings remain owned by users and can also be associated with one or more business pages.

This keeps the listing itself separate from the public site where it may be displayed.

---

# Business mini-sites

Users can create configurable public business spaces.

The current studio includes functionality for:

- business identity and slug
- status / activation
- header customization
- navigation
- editable pages
- home sections
- theme configuration
- template application
- product/service integration
- public contact form

A business has its own public route:

```text
/b/<slug>
```

The editor and public renderer are separated so user-owned configuration can be stored independently from presentation components.

---

## Reusable site templates

The repository includes reusable templates for different business categories, for example:

```text
carpentry
construction
real estate
photography
gym
pizza shop
dentistry
psychology
electrician
developer
sports store
music instruments
English lessons
```

Templates can provide:

- header images
- navigation
- home sections
- galleries
- example products/services
- visual theme configuration

---

## Public contact form

Business sites can expose a public contact form.

The current implementation includes:

- input validation
- basic honeypot spam protection
- per-instance in-memory token-bucket rate limiting
- HTML escaping for user-provided values
- `replyTo` support for owner responses

> The rate limiter is best-effort only because it is stored in process memory. A distributed deployment should use a shared store such as Redis/KV.

---

# Administration

The project contains an admin area protected by the `admin` role.

The most developed administration module is **user management**, which includes:

- paginated user listing
- broad search
- role filtering
- active/inactive filtering
- user detail
- role changes
- account activation/deactivation
- forced logout through `sessionVersion`

Protective checks prevent several dangerous self/admin modifications.

Other admin sections such as metrics, reports and logs currently exist mainly as scaffolding and are not presented here as completed modules.

---

# Interest and productive profiles

The repository also contains experimental data models for deriving keyword-based user profiles.

## Content-interest profile

The application can record interaction signals such as:

```text
view
like
own_post
```

and combine them with precomputed post keywords.

The resulting interest profile stores weighted keyword scores for the user.

## Productive profile

A separate profile aggregates work/professional-related keywords from sources such as:

```text
CV
profile
education
commerce
user tags
```

Different source types and keyword categories receive different weights.

These systems are experimental and are not presented as machine-learning recommendation models.

---

# Data model

The Prisma schema covers multiple product domains, including:

```text
Users / Accounts
Trusted devices
Security logs
Password-change requests
Profiles / privacy configuration
Friendships / followers
Posts / wall entries
Comments / replies
Media
Reactions
Content reports
CV / CV media
Interest profiles
Professional keyword profiles
Products / services
Businesses / business pages
```

This broad relational model is one of the main engineering aspects of the project.

---

# Project structure

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

# Local development

## Requirements

- Node.js / npm
- PostgreSQL database
- Cloudinary account for media features
- Resend configuration for email flows
- Google OAuth credentials if Google login is enabled

Clone:

```bash
git clone https://github.com/SurvilaDeveloper/redsocial.git
cd redsocial
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```text
.env
```

Use `.env.example` as a reference.

Generate Prisma Client:

```bash
npx prisma generate
```

Apply the database schema/migrations according to your local database setup.

Start development mode:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Environment configuration

The application uses environment variables such as:

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

**Never commit real credentials or application secrets.**

---

# Current limitations

The repository is a work in progress.

Important current limitations include:

- no automated test suite yet
- no maintained CI workflow
- email delivery is currently redirected to a provisional test recipient
- some admin sections are placeholders
- in-memory rate limiting is not suitable for multi-instance production deployment
- some media/upload routes still need consolidation and security review
- the application has not undergone an independent security audit
- no production deployment is documented in this repository

---

# Roadmap

Useful next steps include:

- add automated tests for authentication and authorization
- test session invalidation and device revocation
- add API/integration tests for social permissions
- replace provisional email routing with environment-driven production delivery
- consolidate and protect all media upload endpoints
- move rate limiting to Redis / Upstash / shared KV
- add CSRF/abuse review for sensitive actions
- add CI for lint, tests and build
- document database migrations / seed workflow
- add screenshots of CV builder, business studio and admin user management
- define a repository license
- deploy a portfolio-safe demo environment

---

## Author

**Gabriel Survila**

GitHub: [SurvilaDeveloper](https://github.com/SurvilaDeveloper)
