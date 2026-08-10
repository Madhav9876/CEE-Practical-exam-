# 🌐 Technical Roadmap — Mobile-Responsive CEE Nepal Portal

> Mobile-first • Progressive • Secure-by-design

---

## 1. Project Vision

A mobile-responsive web application that lets teachers build, validate, and release CEE exam question sets, and lets students (led by **Kusum Lamichhane**) attempt them with strict syllabus adherence, server-side scoring, negative marking, and teacher-moderated result release.

---

## 2. Phase-Based Roadmap

| Phase | Duration | Milestones | Key Deliverables |
|---|---|---|---|
| **Phase 0 — Kickoff & Planning** | Week 1 | Requirements analysis, syllabus mapping, tech-stack decision | Syllabus catalog (4 programs), DB schema, API contract |
| **Phase 1 — Foundation & Auth** | Week 2 | User auth (JWT), role-based access, DB schema, API skeleton | `/api/v1/auth/*`, `users`, `question_sets` tables, RBAC middleware |
| **Phase 2 — Question Bank & Syllabus Engine** | Week 3 | Question/subtopic model, 45+ sets, weightage validator, modular bank | `questions`/`options` CRUD, composition validator, `questionBank.js` with chapter weightage |
| **Phase 3 — Teacher Dashboard (Release & Moderation)** | Week 4 | Set release + validation gate, result review, feedback toggle | Release API, pending-result list, feedback toggle |
| **Phase 4 — Student Flow (Attempt & Results)** | Week 5 | Exam player (timer, nav, option shuffle), attempt submission, result view | Attempt API, exam UI, result UI with rationale |
| **Phase 5 — Mobile-First UI** | Week 6 | Responsive design, touch-friendly controls, offline-safe assets | Viewport meta, CSS Grid/Flexbox, media queries, tap targets ≥44px |
| **Phase 6 — Security Hardening** | Week 7 | Answer-key hiding, audit trail, IP logging, session limits | Audit middleware, option-field stripping on student responses |
| **Phase 7 — Testing & Verification** | Week 8 | E2E workflow test, load test on question sets, cross-device QA | `server/test-workflow.js` (4 syllabi × 12 sets), mobile QA matrix |
| **Phase 8 — Production Deployment** | Week 9 | HTTPS, rate limiting, DB backups, monitoring | Nginx reverse proxy, fail2ban, PM2, Prometheus metrics |

---

## 3. Architecture Principles

### 3.1 Mobile-First Design Approach
- **CSS Foundation:** Flexbox + Grid with `@media` breakpoints at 600px (tablet) and 900px (desktop).
- **Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1">` enforced on every page.
- **Touch Targets:** Minimum 44×44px for buttons and navigation cells.
- **Responsive Tables:** Horizontal scroll on small screens; stat cards stack on mobile and grid on desktop.
- **Performance:** Critical CSS inlined, lazy image loading, minimal JS bundle.
- **No External Framework Dependency:** Pure CSS ensures zero framework lock-in and smallest possible footprint for low-bandwidth Nepali networks.

### 3.2 Syllabus-Aware Data Model (see [Database Schema](02-database-schema.md))
- Each `question_set` carries a `syllabus` enum: `ce_2025`, `ce_2026`, `bph`, `bns`.
- Validation targets differ per syllabus (e.g., CE 2025 = 80/50/50/20; BNS = 180 nursing + 20 MAT).
- A `subject` field (`biology`, `chemistry`, `physics`, `mental_agility`, `pcl`, `health`) tracks per-chapter weightage.

### 3.3 Zero-Trust Answer Handling
- **Answer keys are never sent to students.** Options are returned without `is_correct`.
- Scoring is 100% server-side — `selected_option_id` is just an integer; the server compares against the stored correct option.
- Results are held `pending` until a teacher explicitly releases them.

---

## 4. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend** | Vanilla HTML/CSS/JS (single-page app) | No build step; instant load; works offline via static files; mobile-first CSS |
| **Backend** | Node.js + Express | Fast, single-language (JS) team consistency; npm ecosystem |
| **Database** | SQLite (WAL mode) | Single-file, zero-config; sufficient for exam-scale; embedded = no network DB dependency for Nepal colleges |
| **Caching** | In-memory LRU for session/user lookups | Simple; swap to Redis in production scale-out |
| **Auth** | JWT (Bearer token) | Stateless; mobile-compatible; 2h TTL |
| **Deployment** | Node + static serving (future: PM2 + Nginx) | Simple; `npm start` single command |
| **Testing** | Node-fetch integration test suite | No external test runner needed; runs in-process |

> **Future Production Upgrade Path:** Express → NestJS (modular, guards); SQLite → PostgreSQL; Redis for sessions/locks; Bootstrap/Tailwind for UI; Docker for containerization.

---

## 5. Mobile Responsiveness Strategy

### 5.1 Breakpoint Scale
```css
/* Mobile-first: base styles target phones */
/* ≥600px: Tablet — 2 columns, larger nav */
@media (min-width: 600px) { .stat-grid { grid-template-columns: repeat(4, 1fr); } }
/* ≥900px: Desktop — wide layout, side-by-side panels */
@media (min-width: 900px) { .row { gap: 16px; } .col { min-width: 200px; } }
```

### 5.2 Component Adaptations
| Component | Mobile (≤599px) | Tablet (600–899px) | Desktop (≥900px) |
|---|---|---|---|
| Login form | Centered, full-width | Max 400px box | Max 400px box |
| Nav bar | Condensed, name role only | Full name + role | Full name + role |
| Question set table | Stacked cards with badges | Compact table | Full table |
| Exam player | 5×5 answer grid | 10×10 grid | 10×10 grid |
| Stat dashboard | 2×2 grid | 4×1 row | 4–8 auto-fit |
| Question block | Single column | Single column | Two-column (Q + options) |

### 5.3 Touch & UX Considerations
- All option selections are full-width tappable `<div>` blocks.
- The answer navigator uses square buttons (aspect-ratio: 1) for easy thumb tapping.
- The countdown timer is large (1.1rem) and color-coded (red when under 5 min).
- Form inputs have 44px min-height for comfortable typing.
- No horizontal scroll required; tables scroll within card containers if needed.

### 5.4 Nepal-Specific Considerations
- Lightweight bundle targets slow/mobile broadband in rural Nepal.
- All text uses system fonts (no external font CDN) for reliability.
- Offline capability via service worker (future phase): cache question sets for areas with intermittent connectivity.

---

## 6. Deployment Steps

1. **Code repository:** Git-hosted project (push/deploy hooks).
2. **Dependency install:** `npm install`
3. **Seed (one-time):** `node server/seed.js` — creates 3 users + 48 question sets.
4. **Start (dev):** `npm start` (runs `node server/index.js`).
5. **Start (prod):** `pm2 start server/index.js --name cee-portal`
6. **Reverse proxy:** Nginx on port 80 → upstream `localhost:3000`.
7. **HTTPS:** Let's Encrypt cert (mandatory for JWT tokens).
8. **Backup:** `cron` job to copy `data/cee.db` to cloud storage daily.

---

## 7. Risk Register

| Risk | Mitigation |
|---|---|
| Mobile layout breakage | Use `@media (max-width)` guards; test on iOS/Android |
| Answer key leakage | Strip `is_correct` from student-facing API; audit-log every fetch |
| Timer drift (mobile tab background) | Server-side expiry check on submission; warn on pagehide |
| Result tampering | Scoring only server-side; signed results; audit trail |
| Syllabus mismatch | Composition validator blocks release if weightage wrong |

---

## 8. Success Criteria

- ✅ 48 question sets (12 per syllabus) generated and composition-validated
- ✅ Mobile-first CSS with breakpoints at 600px and 900px
- ✅ Full student workflow (attempt → submit → pending → release → review) tested end-to-end
- ✅ Server-side scoring with +1/−0.25 negative marking
- ✅ All 4 syllabi (CEE 2025, CEE 2026, BPH, BNS) composition-valid
- ✅ Kusum Lamichhane appears as the student user
- ✅ Audit log tracks all release/review actions
