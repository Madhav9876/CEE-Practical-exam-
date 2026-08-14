# Documentation — Technical Blueprint

This folder contains design documents, schema definitions, and implementation notes for the CEE Nepal Examination Portal.

## Core Exam Specifications

- Total marks: 200
- Format: Single-best-answer multiple‑choice questions (MCQ)
- Total questions: 200
- Scoring: +1 for a correct answer, −0.25 for an incorrect answer, 0 for unanswered
- Minimum number of unique question sets: 45
- Subject distribution:
  - Biology: 80 marks (Zoology 40, Botany 40)
  - Chemistry: 50 marks
  - Physics: 50 marks
  - Mental Agility: 20 marks (verbal, numerical, logical, spatial)
- Cognitive level distribution: 50% Recall, 30% Understanding, 20% Application

## Document Index

1. System Architecture — 01-system-architecture.md
2. Database Schema — 02-database-schema.md
3. Exam Workflow — 03-workflow.md
4. API Endpoint Design — 04-api-endpoints.md
5. Security & Anti-cheating — 05-security.md
6. Technical Roadmap — 06-technical-roadmap.md
7. Content Categorization Plan — 07-content-categorization-plan.md

## Business Rules and Workflow

- Roles: Admin, Teacher, Student; role-based access enforces what each user can see and perform.
- Teachers create question sets; sets must be explicitly released before becoming visible to students.
- Student attempts are recorded as attempts and stored with full audit metadata.
- Results are set to a Pending state after submission; teachers review and release results.
- Feedback and rationales are shown to students only after results are released and if enabled per set.
- Scoring is performed and persisted server-side to prevent client tampering.

## References

See the other files in this directory for architecture diagrams, database DDL, API specs, and deployment notes.
