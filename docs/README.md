# CEE Nepal Examination Portal — Technical Blueprint

A comprehensive system design and implementation plan for a secure, syllabus-aligned Common Entrance Examination (CEE) portal for Nepal.

## Exam Specifications Enforced

| Specification | Value |
|---|---|
| Total Marks | 200 |
| Question Format | Single-best-answer MCQs |
| Total Questions | 200 |
| Scoring | +1 correct, −0.25 incorrect, 0 unanswered |
| Question Sets | ≥ 45 unique sets |
| Subjects | Biology (80), Chemistry (50), Physics (50), Mental Agility (20) |
| Cognitive Levels | 50% Recall, 30% Understanding, 20% Application |

## Subject Weightage Breakdown

| Subject | Marks | Sub-topics |
|---|---|---|
| **Biology** | 80 | Zoology (40), Botany (40) |
| **Chemistry** | 50 | Physical, Inorganic, Organic, Applied/Analytical |
| **Physics** | 50 | Mechanics, Heat/Thermodynamics, Waves/Optics, Electricity/Magnetism, Electrostatics, Modern Physics |
| **Mental Agility Test** | 20 | Verbal, Numerical, Logical, Spatial/Abstract reasoning |

## Document Index

1. [System Architecture](01-system-architecture.md) — Tech stack & high-level design
2. [Database Schema](02-database-schema.md) — Relational schema & DDL
3. [Exam Workflow](03-workflow.md) — Lifecycle from creation to result release
4. [API Endpoint Design](04-api-endpoints.md) — RESTful endpoints
5. [Security Recommendations](05-security.md) — Anti-cheating & integrity controls
6. [Technical Roadmap](06-technical-roadmap.md) — Mobile-first development plan
7. [Content Categorization Plan](07-content-categorization-plan.md) — Syllabus-to-questions mapping

## Core Business Rules

- **Dual-role system:** Teacher/Admin and Student.
- **Question sets** are created by teachers and must be explicitly **released** before students can see them.
- **Results** are held in a **Pending** state after submission; a teacher must review and **release** them.
- **Feedback** (correct answers + rationales) is shown to students **only after** result release, and only if the teacher enabled it.
- **Scoring** is computed server-side to prevent tampering.