# 4. API Endpoint Design

## 4.1 Conventions

- **Base URL:** `/api/v1`
- **Auth:** `Authorization: Bearer <JWT>` on all protected routes
- **Roles:** `[student]`, `[teacher]`, `[admin]` — admin inherits teacher permissions
- **Response envelope:**
  ```json
  {
    "success": true,
    "data": { },
    "error": null
  }
  ```
- **Errors:** Standard HTTP status codes with structured error body:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "SET_NOT_RELEASED",
      "message": "This question set is not available."
    }
  }
  ```

## 4.2 Authentication & Users

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Login, returns access + refresh tokens |
| `POST` | `/auth/refresh` | Public | Refresh access token |
| `POST` | `/auth/logout` | All | Revoke refresh token (Redis blacklist) |
| `GET` | `/auth/me` | All | Current user profile + role |
| `POST` | `/users` | Admin | Create user (teacher/student) |
| `GET` | `/users` | Admin | List users (paginated) |
| `PATCH` | `/users/:id` | Admin | Update user (role, active status) |
| `PATCH` | `/users/:id/password` | All | Change own password |

## 4.3 Question Bank (Teacher)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/question-sets` | Teacher | Create a new draft set |
| `GET` | `/question-sets` | Teacher | List own sets (all statuses) |
| `GET` | `/question-sets/:id` | Teacher | Get set with full question detail |
| `PATCH` | `/question-sets/:id` | Teacher | Update set metadata |
| `DELETE` | `/question-sets/:id` | Teacher | Delete draft set (soft) |
| `POST` | `/question-sets/:id/questions` | Teacher | Add a question to a set |
| `PATCH` | `/questions/:id` | Teacher | Edit a question |
| `DELETE` | `/questions/:id` | Teacher | Remove a question (soft) |
| `POST` | `/questions/:id/options` | Teacher | Add an option |
| `PATCH` | `/options/:id` | Teacher | Edit an option |
| `DELETE` | `/options/:id` | Teacher | Remove an option |
| `GET` | `/question-sets/:id/composition` | Teacher | Validate subject/cognitive weightage |

### Request Example — Create Question Set

```json
POST /api/v1/question-sets
{
  "title": "CEE 2026 — Full Mock Set 01",
  "description": "Complete 200-mark mock exam",
  "subject": "full",
  "total_marks": 200,
  "duration_minutes": 180
}
```

### Request Example — Add Question

```json
POST /api/v1/question-sets/{setId}/questions
{
  "subject": "biology",
  "topic": "Human Physiology",
  "sub_topic": "Zoology",
  "cognitive_level": "understanding",
  "marks": 1.00,
  "negative_marks": 0.25,
  "question_text": "Which structure in the nephron is primarily responsible for reabsorption of glucose?",
  "rationale": "The proximal convoluted tubule reabsorbs ~100% of filtered glucose via SGLT transporters.",
  "options": [
    { "option_label": "A", "option_text": "Proximal convoluted tubule", "is_correct": true, "sort_order": 1 },
    { "option_label": "B", "option_text": "Loop of Henle", "is_correct": false, "sort_order": 2 },
    { "option_label": "C", "option_text": "Distal convoluted tubule", "is_correct": false, "sort_order": 3 },
    { "option_label": "D", "option_text": "Collecting duct", "is_correct": false, "sort_order": 4 }
  ]
}
```

## 4.4 Set Release (Teacher)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/question-sets/:id/release` | Teacher | Release a validated set to students |
| `POST` | `/question-sets/:id/unrelease` | Teacher | Un-release (revert to draft) |
| `POST` | `/question-sets/:id/archive` | Teacher | Archive a set (hide from students) |

**Release validation:** Backend re-checks composition (200 marks, subject split, cognitive split) before allowing release. Returns `422` if invalid.

## 4.5 Student Exam Access

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/student/sets` | Student | List **released** sets available to attempt |
| `GET` | `/student/sets/:id` | Student | Get set metadata (no questions until attempt starts) |
| `POST` | `/student/attempts` | Student | Start an attempt on a released set |
| `GET` | `/student/attempts/:id/questions` | Student | Fetch questions + shuffled options for active attempt |
| `PUT` | `/student/attempts/:id/answers/:questionId` | Student | Save/update an answer during attempt |
| `POST` | `/student/attempts/:id/submit` | Student | Submit attempt (server scores, result → pending) |
| `GET` | `/student/attempts` | Student | List own attempts + result status |

### Request Example — Start Attempt

```json
POST /api/v1/student/attempts
{
  "question_set_id": "uuid-of-released-set"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attempt_id": "uuid",
    "started_at": "2026-08-10T09:00:00Z",
    "time_limit_seconds": 10800,
    "question_count": 200
  }
}
```

### Request Example — Submit Attempt

```json
POST /api/v1/student/attempts/{attemptId}/submit
{
  "answers": [
    { "question_id": "uuid-1", "selected_option_id": "uuid-opt-A" },
    { "question_id": "uuid-2", "selected_option_id": null },
    { "question_id": "uuid-3", "selected_option_id": "uuid-opt-C" }
  ]
}
```

**Response (student sees only pending state):**
```json
{
  "success": true,
  "data": {
    "attempt_id": "uuid",
    "status": "submitted",
    "result_status": "pending",
    "message": "Your exam has been submitted. Results will be available after teacher review."
  }
}
```

## 4.6 Result Moderation (Teacher)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/teacher/results` | Teacher | List results (filter by status=pending/released) |
| `GET` | `/teacher/results/:id` | Teacher | Full result detail + student answer sheet |
| `GET` | `/teacher/results/:id/answers` | Teacher | Per-question answer breakdown |
| `PATCH` | `/teacher/results/:id/release` | Teacher | Release result (with feedback toggle) |
| `PATCH` | `/teacher/results/:id/hold` | Teacher | Hold/flag result for further review |

### Request Example — Release Result

```json
PATCH /api/v1/teacher/results/{resultId}/release
{
  "feedback_enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result_id": "uuid",
    "status": "released",
    "feedback_enabled": true,
    "released_at": "2026-08-10T11:30:00Z"
  }
}
```

## 4.7 Student Result Viewing

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/student/results` | Student | List own results (only released visible) |
| `GET` | `/student/results/:id` | Student | View released result: score, breakdown, feedback |

### Response Example — Released Result (feedback enabled)

```json
{
  "success": true,
  "data": {
    "result_id": "uuid",
    "status": "released",
    "total_marks": 142.50,
    "correct_count": 150,
    "incorrect_count": 30,
    "unanswered_count": 20,
    "feedback_enabled": true,
    "breakdown": [
      {
        "question_id": "uuid-1",
        "question_text": "Which structure in the nephron...?",
        "selected_option": "A",
        "correct_option": "A",
        "is_correct": true,
        "marks_awarded": 1.00,
        "rationale": "The proximal convoluted tubule reabsorbs..."
      },
      {
        "question_id": "uuid-2",
        "question_text": "...",
        "selected_option": null,
        "correct_option": "C",
        "is_correct": false,
        "marks_awarded": 0.00,
        "rationale": "..."
      }
    ]
  }
}
```

**Access rule:** If `status = pending`, the endpoint returns `403 RESULT_PENDING`. If `feedback_enabled = false`, the `rationale` and `correct_option` fields are omitted.

## 4.8 Audit & Admin

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/audit-logs` | Admin | Query audit trail (filter by actor/entity/action) |
| `GET` | `/admin/stats` | Admin | Platform stats (attempts, releases, active users) |
| `GET` | `/admin/health` | Admin | System health (DB, Redis, queue) |

## 4.9 Error Codes Reference

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Malformed request body |
| 401 | `UNAUTHORIZED` | Missing/invalid token |
| 403 | `FORBIDDEN` | Role lacks permission |
| 403 | `RESULT_PENDING` | Result not yet released |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `ALREADY_ATTEMPTED` | Student already attempted this set |
| 409 | `SET_NOT_RELEASED` | Set not available to students |
| 422 | `COMPOSITION_INVALID` | Set fails weightage validation |
| 422 | `SINGLE_ANSWER_VIOLATION` | Question has ≠1 correct option |
| 429 | `RATE_LIMITED` | Too many requests |

## 4.10 Pagination & Filtering

All list endpoints support:

```
GET /teacher/results?status=pending&page=1&limit=20&sort=created_at:desc
GET /student/sets?subject=biology&page=1&limit=10
```

Response includes:
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 145,
      "total_pages": 8
    }
  }
}