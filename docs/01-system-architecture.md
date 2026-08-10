# 1. System Architecture

## 1.1 High-Level Overview

A **three-tier, modular monolith** architecture deployed as containerized services. This balances security, maintainability, and deployment simplicity for an examination environment where transactional integrity is critical.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                     │
│   Student Web App          Teacher/Admin Web App                    │
│   (React + TypeScript)     (React + TypeScript)                     │
│   Progressive Web App      Responsive dashboard                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS / WSS
┌───────────────────────────────▼─────────────────────────────────────┐
│                      API GATEWAY / REVERSE PROXY                     │
│                     (Nginx / Traefik)                                │
│   • TLS termination        • Rate limiting                           │
│   • Request validation     • WAF rules                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                        APPLICATION LAYER                             │
│                                                                     │
│   ┌────────────────────┐   ┌────────────────────┐                   │
│   │  Auth Service      │   │  Exam Service      │                   │
│   │  (JWT, RBAC)       │   │  (Sets, Attempts)  │                   │
│   └────────────────────┘   └────────────────────┘                   │
│   ┌────────────────────┐   ┌────────────────────┐                   │
│   │  Question Service  │   │  Result Service    │                   │
│   │  (Bank, Release)   │   │  (Scoring, Review) │                   │
│   └────────────────────┘   └────────────────────┘                   │
│                                                                     │
│   Framework: NestJS (Node.js) — modular, DI, guards, interceptors    │
└───────────────┬──────────────────────────────┬──────────────────────┘
                │                              │
┌───────────────▼──────────────┐  ┌────────────▼─────────────────────┐
│      DATA LAYER              │  │        CACHE / QUEUE LAYER        │
│                              │  │                                  │
│  PostgreSQL 16 (primary)     │  │  Redis 7                          │
│  • Relational integrity      │  │  • Session/JWT blacklist          │
│  • ACID transactions         │  │  • Rate-limit counters            │
│  • Row-level security        │  │  • Attempt state cache            │
│  • Encrypted at rest         │  │  • Job queue (result processing)  │
│                              │  │                                  │
│  Read replica (reporting)    │  │  BullMQ (background jobs)         │
└──────────────────────────────┘  └──────────────────────────────────┘
```

## 1.2 Recommended Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS | Fast, type-safe, componentized UI for both roles |
| **State/Data** | TanStack Query, Zustand | Server-state caching, optimistic UI |
| **Backend** | NestJS (Node.js) + TypeScript | Modular architecture, built-in guards, DI, strong typing |
| **API Style** | REST (JSON) + OpenAPI 3.1 | Clear contract, auto-generated docs |
| **Database** | PostgreSQL 16 | ACID transactions, relational integrity, row-level security |
| **Cache/Queue** | Redis 7 + BullMQ | Session state, rate limiting, async result processing |
| **Auth** | JWT (short-lived) + refresh tokens, bcrypt/argon2 | Stateless auth with revocation support |
| **Validation** | class-validator + Zod | Input sanitization at API boundary |
| **ORM** | Prisma or TypeORM | Type-safe schema, migrations |
| **File/Media** | S3-compatible object storage | Rationale images, question media |
| **Deployment** | Docker + Docker Compose, Nginx | Reproducible, portable, secure |
| **Observability** | Prometheus + Grafana, structured logging (pino) | Monitoring, audit trails |
| **CI/CD** | GitHub Actions | Automated tests, migrations, deploys |

## 1.3 Architectural Principles

1. **Server-side scoring authority** — All scoring and negative-marking logic executes on the backend; the client never computes or trusts scores.
2. **Defense in depth** — API gateway → application guards → database row-level security → encrypted storage.
3. **Least privilege** — Role-based access control (RBAC) enforced at both the route and data-query layers.
4. **Immutable exam records** — Attempts and answers are append-only; corrections create new records with audit entries.
5. **Stateless API, stateful cache** — JWT for identity; Redis for short-lived attempt state and rate limiting.
6. **Separation of concerns** — Question bank, exam delivery, and result moderation are isolated services/modules.

## 1.4 Deployment Topology

```
[Internet]
    │
    ▼
[Nginx Reverse Proxy] ── TLS 1.3, WAF, rate limiting
    │
    ├── [Frontend Static Build] (CDN / Nginx)
    │
    └── [NestJS API] (scaled horizontally behind load balancer)
            │
            ├── [PostgreSQL Primary] ── streaming ── [Read Replica]
            ├── [Redis]
            └── [Object Storage] (question media)
```

- **Horizontal scaling:** API and frontend scale independently; PostgreSQL uses a primary + read replica for reporting queries.
- **Backups:** Daily full + continuous WAL archiving; point-in-time recovery.
- **Environment isolation:** `dev`, `staging`, `production` with separate credentials and data.

## 1.5 Module Breakdown (Backend)

| Module | Responsibility |
|---|---|
| **AuthModule** | Login, JWT issuance/refresh, role guards, password hashing |
| **UsersModule** | User CRUD, profile, role assignment |
| **QuestionBankModule** | Question/set CRUD, categorization, media, validation |
| **ReleaseModule** | Teacher release/unrelease of question sets |
| **ExamModule** | Attempt lifecycle: start, answer, submit, timer |
| **ResultModule** | Server-side scoring, pending state, teacher review, release, feedback toggle |
| **AuditModule** | Immutable audit log of all sensitive actions |
| **NotificationModule** | Email/in-app notifications on release events |

## 1.6 Frontend Structure

```
frontend/
├── src/
│   ├── features/
│   │   ├── auth/          # Login, session
│   │   ├── student/       # Available exams, attempt player, results
│   │   ├── teacher/       # Question bank, set management, review queue
│   │   └── shared/        # UI components, guards, API client
│   ├── api/               # Typed API client (generated from OpenAPI)
│   ├── router/            # Route guards (role-based)
│   └── stores/            # Zustand stores
```

- **Route guards** prevent students from accessing teacher routes and vice versa.
- **Attempt player** is a dedicated, distraction-free full-screen view with a countdown timer and auto-submit.