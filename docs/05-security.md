# 5. Security Recommendations

## 5.1 Threat Model Overview

| Threat | Impact | Mitigation |
|---|---|---|
| Question bank leakage | Exam integrity destroyed | Encryption, RBAC, no client-side answer keys, audit logging |
| Unauthorized access | Data breach | JWT + RBAC, row-level security, least privilege |
| Result tampering | False scores | Server-side scoring, immutable records, audit trail |
| Cheating during exam | Unfair advantage | Timer enforcement, IP/device tracking, question shuffling, tab-switch detection |
| Brute-force / credential stuffing | Account takeover | Rate limiting, lockout, MFA |
| Injection (SQL/XSS) | Data compromise | Parameterized queries, input validation, CSP |
| Session hijacking | Account takeover | Short-lived JWTs, refresh rotation, Redis blacklist |

## 5.2 Authentication & Authorization

### 5.2.1 Password Security
- Hash passwords with **Argon2id** (or bcrypt with cost ≥ 12).
- Enforce strong password policy: min 8 chars, complexity, no common passwords.
- Implement **account lockout** after 5 failed attempts (15-min lock, exponential backoff).
- Support **MFA (TOTP)** for teacher/admin accounts.

### 5.2.2 Token Strategy
- **Access token:** JWT, short-lived (15 min), signed with RS256.
- **Refresh token:** Opaque, stored hashed in DB, rotated on every use, revoked on logout.
- **Redis blacklist** for revoked tokens to support immediate invalidation.
- Tokens carry only `sub` (user id) and `role`; all other data fetched server-side.

### 5.2.3 Role-Based Access Control (RBAC)
- Enforced at **three layers**:
  1. **Route guards** (NestJS `RolesGuard`) — reject unauthorized HTTP requests.
  2. **Service-layer checks** — verify ownership (e.g., teacher can only edit own sets).
  3. **Database row-level security (RLS)** — PostgreSQL policies restrict rows by `role` and `created_by`.
- Admin inherits teacher permissions; students are strictly isolated from teacher endpoints.

## 5.3 Question Bank Protection

### 5.3.1 Server-Side Answer Keys
- **Correct answers (`is_correct`) and rationales are NEVER sent to the client** during an exam.
- The student attempt API returns only `option_text` and `option_label` — never `is_correct` or `rationale`.
- Rationales are only exposed post-release via the result endpoint, and only if `feedback_enabled = true`.

### 5.3.2 Encryption at Rest
- Database volume encrypted (AES-256) at the storage layer.
- Sensitive columns (`password_hash`, `is_correct`, `rationale`) additionally encrypted with application-level keys (KMS-managed) if threat model requires defense-in-depth.

### 5.3.3 Access Control
- Only `teacher`/`admin` roles can read `is_correct` and `rationale` via the question-bank API.
- Row-level security policy:
  ```sql
  CREATE POLICY teacher_owns_sets ON question_sets
    FOR ALL TO authenticated
    USING (created_by = current_user_id() OR current_role() = 'admin');
  ```

### 5.3.4 Anti-Scraping
- Rate limit question-bank endpoints aggressively (e.g., 30 req/min per teacher).
- Require MFA for bulk export operations.
- Audit-log every read of a full set with answers.

## 5.4 Anti-Cheating Measures

### 5.4.1 Server-Authoritative Timer
- The client displays a countdown, but the **server** enforces the deadline.
- On submit, server validates `now() <= started_at + time_limit_seconds`.
- Background job auto-submits expired attempts.

### 5.4.2 Question & Option Shuffling
- Each student receives a **unique question order** and **unique option order** per attempt.
- Shuffling is deterministic per attempt (seeded by attempt ID) so answers map correctly server-side.
- Prevents students from sharing "question 5 = answer B" across attempts.

### 5.4.3 Tab-Switch / Focus Detection
- Frontend detects `visibilitychange` / `blur` events during the exam.
- Logs a `FOCUS_LOST` event to the audit trail with timestamp.
- Configurable policy: warn after N events, auto-submit after M events (teacher-configurable).

### 5.4.4 IP & Device Fingerprinting
- Record `ip_address` and `user_agent` on attempt start.
- Flag attempts where multiple students share the same IP/device within a short window.
- Optional: block concurrent attempts from the same IP.

### 5.4.5 Clipboard & Right-Click Restrictions
- Disable copy/paste and right-click within the exam player (client-side deterrent only; server remains authoritative).

### 5.4.6 One-Attempt Enforcement
- `UNIQUE (student_id, question_set_id)` on `attempts` prevents re-taking a set.
- Server rejects `409 ALREADY_ATTEMPTED` if violated.

## 5.5 Result Integrity

### 5.5.1 Server-Side Scoring
- Scoring runs **only** in a single DB transaction on the backend at submission.
- The client never computes or submits a score.
- `results.total_marks` is written once and treated as immutable.

### 5.5.2 Immutable Records
- `attempt_answers` and `results` are **append-only** — no `UPDATE`/`DELETE` allowed at the DB level (revoke permissions; only `INSERT` and `SELECT`).
- Any correction (e.g., teacher adjusts a score) creates a new `result_adjustments` record with reason + audit entry, never overwrites the original.

### 5.5.3 Audit Trail
- Every sensitive action writes to `audit_logs`:
  - `SET_RELEASED`, `SET_UNRELEASED`, `SET_ARCHIVED`
  - `ATTEMPT_STARTED`, `ATTEMPT_SUBMITTED`, `ATTEMPT_EXPIRED`
  - `RESULT_REVIEWED`, `RESULT_RELEASED`, `RESULT_HELD`
  - `FOCUS_LOST`, `LOGIN_FAILED`, `PASSWORD_CHANGED`
- Audit logs are **immutable** (append-only) and readable only by admin.

## 5.6 Network & Transport Security

| Layer | Measure |
|---|---|
| **TLS** | TLS 1.3 only, HSTS enabled, secure ciphers |
| **API Gateway** | Nginx/Traefik with WAF rules (OWASP CRS), request size limits |
| **Rate Limiting** | Per-user + per-IP: login (5/min), API (120/min), question-bank (30/min) |
| **CORS** | Strict allowlist of frontend origins only |
| **Headers** | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, CSP |
| **CSP** | `default-src 'self'`; no inline scripts; restrict media to object storage domain |

## 5.7 Input Validation & Injection Prevention

- **All inputs** validated with `class-validator` DTOs + Zod at the API boundary.
- **Parameterized queries** exclusively (Prisma/TypeORM) — no string-concatenated SQL.
- **XSS prevention:** React auto-escapes; CSP blocks inline scripts; sanitize any rendered HTML (rationales) with DOMPurify.
- **File uploads** (question media): validate MIME type, size limit (5 MB), scan with ClamAV, serve from separate domain with no-execute headers.

## 5.8 Database Security

| Measure | Implementation |
|---|---|
| **Least-privilege DB roles** | App role has only `SELECT/INSERT/UPDATE` on needed tables; no `DROP`/`TRUNCATE` |
| **Row-level security** | Enforce ownership/role policies at the DB layer |
| **Encryption at rest** | AES-256 volume encryption |
| **Encryption in transit** | TLS between app and DB |
| **Backups** | Encrypted, off-site, point-in-time recovery (WAL archiving) |
| **Connection pooling** | PgBouncer with strict limits to prevent resource exhaustion |

## 5.9 Operational Security

- **Secrets management:** All credentials in environment variables / Vault; never in code or repo.
- **Environment isolation:** `dev`/`staging`/`prod` with separate DBs and credentials.
- **Dependency scanning:** `npm audit` + Snyk in CI; pin dependencies.
- **Container security:** Run as non-root, read-only filesystem, minimal base images, image scanning.
- **Logging:** Structured logs (pino) with request IDs; no PII in logs; centralized in Grafana/Loki.
- **Monitoring & alerting:** Prometheus alerts for failed logins, rate-limit breaches, DB anomalies, and audit-log anomalies.

## 5.10 Compliance & Privacy

- **Data minimization:** Collect only necessary user data (name, email, role).
- **Retention policy:** Exam data retained per institutional policy; users can request deletion (GDPR-style).
- **Consent:** Clear privacy notice at registration.
- **Access logs:** Students can view their own audit trail (transparency).

## 5.11 Security Checklist (Pre-Launch)

- [ ] TLS 1.3 + HSTS configured
- [ ] WAF rules active (OWASP CRS)
- [ ] Rate limiting enforced on all auth + question-bank endpoints
- [ ] MFA enabled for all teacher/admin accounts
- [ ] Row-level security policies tested
- [ ] `is_correct`/`rationale` never returned in student exam payloads (verified via integration test)
- [ ] Scoring verified server-side with negative-marking unit tests
- [ ] Audit logging verified for all sensitive actions
- [ ] Backup + restore drill completed
- [ ] Dependency scan clean; containers run non-root
- [ ] Penetration test performed (OWASP Top 10)
- [ ] Load test: 500 concurrent students, 200-question sets