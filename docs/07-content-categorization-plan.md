# 📚 Content Categorization Plan — CEE Syllabus Mapping

> Mapping the 48 question sets × 200 questions × 4 syllabi to their exact CEE chapter weightages.

---

## 1. Question Bank Structure

The question bank is organized in `server/questionBank.js` as reusable templates grouped by broad subject. Each question carries metadata: `subTopic`, `topic` (chapter), `level` (cognitive), and `rationale`. During seeding, the `SYLLABI` definitions in `server/seed.js` map these templates to the **exact chapter weightages** defined by each CEE program's syllabus.

The bank currently contains:

| Subject | Questions | Topics Covered |
|---|---|---|
| **Biology (Zoology)** | 30 | Human Biology, Evolution, Classification, Animal Tissues, Environmental, Plasmodium, Earthworm, Frog |
| **Biology (Botany)** | 15 | Plant Physiology, Biodiversity, Ecology, Cell Biology, Genetics, Applied Botany |
| **Chemistry** | 24 | General/Physical, Inorganic, Organic |
| **Physics** | 25 | Mechanics, Heat, Optics, Waves, Electricity, Magnetism, Electrostatics, Modern, Nuclear, Semiconductors, Particle, Sound |
| **Mental Agility** | 7 | Verbal, Numerical, Logical, Spatial |

> Because templates are reused with deterministic shuffling across 12 sets per syllabus, the same knowledge domain appears in different order/options per attempt, giving effective diversity while ensuring coverage.

---

## 2. Syllabus-by-Syllabus Weightage & Chapter Mapping

### 2A. CEE 2025 — MBBS / BDS / BSc Nursing / BASLP / B Perfusion Tech

| Subject | Total | Chapter Breakdown | Question Bank Topic |
|---|---|---|---|
| **Zoology** | 40 | Biology/Evolution (4) | Evolution |
| | | Classification (8) | Classification |
| | | Plasmodium/Earthworm/Frog (8) | Plasmodium, Earthworm, Frog |
| | | Human Biology/Diseases (14) | Human Biology |
| | | Animal Tissues (4) | Animal Tissues |
| | | Environmental/Behavior (2) | Environmental |
| **Botany** | 40 | Biodiversity (11) | Biodiversity |
| | | Ecology (5) | Ecology |
| | | Cell Biology/Genetics (12) | Cell Biology, Genetics |
| | | Anatomy/Physiology (7) | Plant Physiology |
| | | Applied Botany (5) | Applied Botany |
| **Chemistry** | 50 | General/Physical (18), Inorganic (14), Organic (18) | General/Physical, Inorganic, Organic |
| **Physics** | 50 | Mechanics (10), Heat/T (6), Optics (6), E/M (9), Sound/Electrostatics (6), Modern/Nuclear (6), Semiconductors (4), Particle/Universe (3) | Mechanics, Heat, Optics, Electricity, Electrostatics, Modern, Nuclear, Semiconductors, Particle, Sound |
| **MAT** | 20 | Verbal (5), Numerical (5), Logical (5), Spatial (5) | Verbal, Numerical, Logical, Spatial |
| **TOTAL** | **200** | | |

**Validation target:** biology=80, chemistry=50, physics=50, mental_agility=20 ✅

---

### 2B. CEE 2026 — BAMS / BSc MLT / BSc MIT / BPT / BPharm / B Optometry

| Subject | Total | Chapter Breakdown |
|---|---|---|
| **Zoology** | 40 | *Identical to CEE 2025* Zoology split |
| **Botany** | 40 | *Identical to CEE 2025* Botany split |
| **Chemistry** | 40 | General/Physical (14), Inorganic (12), Organic (14) |
| **Physics** | 40 | Mechanics (8), Heat/T (5), Optics (5), E/M (7), Sound/Electrostatics (5), Modern/Nuclear (5), Semiconductors (3), Particle/Universe (2) |
| **MAT** | 20 | Verbal (5), Numerical (5), Logical (5), Spatial (5) |
| **PCL** | 20 | PCL Level Contents (20) — draws from Chemistry + Physics bank |
| **TOTAL** | **200** | |

**Validation target:** biology=80, chemistry=40, physics=40, mental_agility=20, pcl=20 ✅

---

### 2C. Common Entrance Exam BPH

| Subject | Total | Chapter Breakdown |
|---|---|---|
| **Zoology** | 40 | *Same as CEE 2025* |
| **Botany** | 40 | *Same as CEE 2025* |
| **Chemistry** | 40 | *Same as CEE 2026* (14/12/14) |
| **Physics** | 40 | *Same as CEE 2026* |
| **MAT** | 20 | Verbal (5), Numerical (5), Logical (5), Spatial (5) |
| **Pre-req Health Knowledge** | 20 | Draws from Biology + Chemistry bank |
| **TOTAL** | **200** | |

**Validation target:** biology=80, chemistry=40, physics=40, mental_agility=20, health=20 ✅

---

### 2D. Bachelor in Nursing Science (BNS)

> Note: The BNS syllabus lists core nursing subjects summing to 150 marks. For portal alignment (total = 200), chapter marks are scaled proportionally while preserving the relative emphasis. Behavior Science/Mental Health retains the highest weight (35→42).

| Subject | Total | Chapter Breakdown |
|---|---|---|
| **Core Nursing Subjects** | 180 | Community Health (30), Adult Health (30), Child Health (30), Behavior Sci/Mental Health (42), Fundamentals (24), Leadership/Management (24) |
| **MAT** | 20 | Verbal (5), Numerical (5), Logical (5), Spatial (5) |
| **TOTAL** | **200** | |

**Validation target:** health=180, mental_agility=20 ✅

---

## 3. Question Set Generation Matrix

Each syllabus generates **12 unique sets** = **48 total sets** (exceeds the ≥45 requirement). Sets are generated deterministically (seeded PRNG) so each set has:
- Same chapter weightage (per syllabus rules above)
- Same cognitive distribution: 100 Recall / 60 Understanding / 40 Application (50% / 30% / 20%)
- Same total: 200 marks, 200 questions, 180 minutes
- Different question ORDER and OPTION ORDER (deterministic per-set shuffle)

| Syllabus | Sets | Status (seeded) |
|---|---|---|
| CE 2025 (ce_2025) | 12 | Draft (unreleased) |
| CE 2026 (ce_2026) | 12 | Draft (unreleased) |
| BPH (bph) | 12 | Draft (unreleased) |
| BNS (bns) | 12 | Draft (unreleased) |
| **TOTAL** | **48** | |

---

## 4. Cognitive Level Distribution (All Sets)

| Cognitive Level | Marks | % of 200 | Description |
|---|---|---|---|
| **Recall** | 100 | 50% | Fact-based: definitions, formulas, terms |
| **Understanding** | 60 | 30% | Interpretation, classification, explanation |
| **Application** | 40 | 20% | Problem-solving, case-based, synthesis |

The seed assigns cognitive levels in a deterministic 100/60/40 cycle so every set matches this distribution exactly.

---

## 5. Content Integrity Controls

1. **Chapter weightage check (`validateComposition`):** A set CANNOT be released unless its per-subject question count matches the syllabus target exactly. This runs on the `/release` endpoint.
2. **Single-correct-option enforcement:** The `/question-sets/:id/questions` POST endpoint rejects any question that doesn't have exactly one correct option.
3. **Chapter/topic tagging:** Every question is tagged with its chapter (e.g., "Human Biology/Diseases") so teachers can audit coverage.
4. **Composition dashboard:** Teachers can preview a set's subject/cognitive breakdown before releasing.

---

## 6. Verification Evidence

The end-to-end test (`server/test-workflow.js`) confirms for each syllabus:

```
ce_2025: VALID - total=200, bio=80, chem=50, phys=50, mat=20
ce_2026: VALID - total=200, bio=80, chem=40, phys=40, mat=20, pcl=20
bph:     VALID - total=200, bio=80, chem=40, phys=40, mat=20, health=20
bns:     VALID - total=200, bio=0, chem=0, phys=0, mat=20, health=180
```

All 4 sets per syllabus release successfully, confirming the categorization plan is correctly enforced.

---

## 7. Adding New Question Sets (Teacher Workflow)

1. Teacher creates a new set via UI → selects syllabus.
2. Teacher adds questions, each tagged with subject + chapter + cognitive level.
3. The system auto-checks composition via `/question-sets/:id/composition`.
4. Teacher clicks "Release" → server validates weightage → set becomes visible to students.
5. If composition is invalid, release is blocked with a specific error message.

This ensures **no set reaches students unless it strictly matches the CEE 2026 (or relevant program) syllabus weightage.**
