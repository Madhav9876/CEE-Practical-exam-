# 3. Exam Workflow

## 3.1 Lifecycle Overview

The exam lifecycle spans five phases: **Creation → Release → Attempt → Review → Result Release**. Each phase has strict state transitions enforced by the backend.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXAM LIFECYCLE (STATE MACHINE)                        │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   DRAFT      │    │   RELEASED   │    │  SUBMITTED   │    │  PENDING  │  │
│  │ (question    │───▶│ (visible to  │───▶│ (attempt     │───▶│ (result   │  │
│  │  set created)│    │  students)   │    │  completed)  │    │  awaiting │  │
│  └──────────────┘    └──────────────┘    └──────────────┘    │  review)  │  │
│         ▲                  │                                  └─────┬─────┘  │
│         │                  │                                        │       │
│         │ edit/archive     │                                        │       │
│         │                  ▼                                        ▼       │
│  ┌──────────────┐    ┌──────────────┐                        ┌───────────┐  │
│  │   ARCHIVED   │    │  (student    │                        │  RELEASED │  │
│  │ (hidden from │    │   attempts)  │                        │ (student  │  │
│  │  students)   │    └──────────────┘                        │  sees     │  │
│  └──────────────┘                                            │  result)  │  │
│                                                              └───────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Detailed Phase Flow

### Phase 1 — Question Creation (Teacher)

```
Teacher logs in (role: teacher/admin)
        │
        ▼
Create Question Set (draft)
        │
        ▼
Add Questions with:
  • subject (biology/chemistry/physics/mental_agility)
  • topic & sub-topic (syllabus categorization)
  • cognitive level (recall/understanding/application)
  • 4 options with exactly 1 correct key
  • rationale (for feedback)
        │
        ▼
Validate composition:
  • total marks = 200
  • Biology 80 / Chemistry 50 / Physics 50 / Mental Agility 20
  • cognitive split 50% / 30% / 20%
        │
        ▼
[Validation fails] ──▶ return errors to teacher for correction
        │
        ▼
[Validation passes] ──▶ Set remains in DRAFT
```

**Key rule:** A set cannot be released until composition validation passes.

### Phase 2 — Teacher Release

```
Teacher reviews draft set
        │
        ▼
Teacher clicks "Release"
        │
        ▼
Backend re-validates composition (defense in depth)
        │
        ▼
[Invalid] ──▶ Reject release, log audit entry
        │
        ▼
[Valid] ──▶ status = 'released', released_at = now()
        │
        ▼
Audit log: SET_RELEASED
        │
        ▼
Set becomes visible to all students
```

**Key rule:** Only `released` sets appear in the student's available-exam list.

### Phase 3 — Student Attempt

```
Student logs in (role: student)
        │
        ▼
Student views "Available Exams" → only released sets
        │
        ▼
Student starts attempt
        │
        ▼
Backend:
  • verifies set is released
  • verifies student hasn't already attempted (UNIQUE constraint)
  • creates attempt row (status = in_progress)
  • serves questions with options SHUFFLED (per-student order)
  • starts countdown timer (server-authoritative)
        │
        ▼
Student answers questions (client stores selections locally)
        │
        ▼
Student submits (or timer expires → auto-submit)
        │
        ▼
Backend (single transaction):
  • marks attempt status = 'submitted'
  • computes score server-side (+1 / −0.25 / 0)
  • creates result row with status = 'pending'
        │
        ▼
Student sees ONLY: "Exam submitted. Result pending teacher review."
```

**Key rules:**
- Student **cannot** see score at submission.
- Result is created in `pending` state.
- No immediate feedback is shown.

### Phase 4 — Teacher Review

```
Teacher opens "Review Queue" → lists results with status = 'pending'
        │
        ▼
Teacher reviews each attempt:
  • sees student's answer sheet
  • sees per-question correct/incorrect
  • sees computed score breakdown
        │
        ▼
Teacher decides:
  • Release result (with or without feedback)
  • or hold / flag for review
        │
        ▼
Audit log: RESULT_REVIEWED
```

**Key rule:** Results remain invisible to students until the teacher acts.

### Phase 5 — Result Release

```
Teacher clicks "Release Result"
        │
        ▼
Teacher toggles feedback_enabled (show answers + rationales? yes/no)
        │
        ▼
Backend:
  • status = 'released'
  • released_at = now()
  • reviewed_by / reviewed_at recorded
        │
        ▼
Audit log: RESULT_RELEASED
        │
        ▼
Student can now view:
  • final score (with negative marking applied)
  • correct / incorrect / unanswered breakdown
  • (if feedback_enabled) correct answers + rationales
```

## 3.3 State Transition Table

| Entity | From | To | Trigger | Actor |
|---|---|---|---|---|
| `question_sets` | draft | released | Teacher "Release" + validation | Teacher |
| `question_sets` | released | archived | Teacher "Archive" | Teacher |
| `question_sets` | draft | archived | Teacher "Archive" | Teacher |
| `attempts` | in_progress | submitted | Student submit / auto-submit | Student/System |
| `attempts` | in_progress | expired | Timer expiry | System |
| `results` | pending | released | Teacher "Release Result" | Teacher |

## 3.4 Sequence Diagram (End-to-End)

```
Student          Frontend          Backend API          Database
   │                 │                  │                   │
   │ 1. Login        │                  │                   │
   │────────────────▶│  2. POST /auth   │                   │
   │                 │─────────────────▶│                   │
   │                 │                  │ 3. verify creds   │
   │                 │                  │──────────────────▶│
   │                 │                  │ 4. JWT issued     │
   │                 │◀─────────────────│                   │
   │                 │                  │                   │
   │ 5. List exams   │                  │                   │
   │────────────────▶│ 6. GET /sets     │                   │
   │                 │─────────────────▶│ 7. released only  │
   │                 │                  │──────────────────▶│
   │                 │◀─────────────────│                   │
   │                 │                  │                   │
   │ 8. Start exam   │                  │                   │
   │────────────────▶│ 9. POST /attempts│                   │
   │                 │─────────────────▶│ 10. create attempt│
   │                 │                  │──────────────────▶│
   │                 │◀─ questions (shuffled) ──────────────│
   │                 │                  │                   │
   │ 11. Answer      │                  │                   │
   │ (local state)   │                  │                   │
   │                 │                  │                   │
   │ 12. Submit      │                  │                   │
   │────────────────▶│ 13. POST /submit │                   │
   │                 │─────────────────▶│ 14. score txn     │
   │                 │                  │──────────────────▶│
   │                 │                  │ 15. result=pending│
   │                 │◀─ "pending" ─────│                   │
   │                 │                  │                   │
   │ 16. "Result     │                  │                   │
   │     pending"    │                  │                   │
   │                 │                  │                   │
   │ 17. Teacher     │                  │                   │
   │     reviews     │                  │ 18. GET /results  │
   │                 │                  │   (pending queue) │
   │                 │                  │──────────────────▶│
   │                 │                  │                   │
   │ 19. Teacher     │                  │ 20. PATCH /results│
   │     releases    │                  │   /:id/release    │
   │                 │                  │──────────────────▶│
   │                 │                  │ 21. status=released│
   │                 │                  │──────────────────▶│
   │                 │                  │                   │
   │ 22. Student     │                  │                   │
   │     views       │                  │ 23. GET /results  │
   │     result      │                  │   /:id            │
   │                 │─────────────────▶│──────────────────▶│
   │                 │◀─ score + breakdown (+ feedback) ────│
   │                 │                  │                   │
```

## 3.5 Timer & Auto-Submit Logic

- The **server** is the source of truth for time. The client displays a countdown but the server enforces the deadline.
- On submit, the server checks `now() <= started_at + time_limit_seconds`.
- If the deadline passes, the server marks the attempt `expired` and auto-submits whatever answers were recorded, then scores it.
- A background job (BullMQ) sweeps `in_progress` attempts past their deadline to guarantee no attempt is left unscored.

## 3.6 Feedback Visibility Rules

| Result State | Score visible? | Breakdown visible? | Answers + Rationales visible? |
|---|---|---|---|
| `pending` | ❌ No | ❌ No | ❌ No |
| `released` + `feedback_enabled = false` | ✅ Yes | ✅ Yes | ❌ No |
| `released` + `feedback_enabled = true` | ✅ Yes | ✅ Yes | ✅ Yes |