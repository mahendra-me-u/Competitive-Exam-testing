# Competitive-Exam-testing
# NCSM MCQ Platform - Updated Version

This version adds an NCSM section to the existing Firebase MCQ platform.

## Added

Dashboard:
- New `NCSM` card
- `National Computer Saksharta Mission`
- `Mock Test` button

NCSM:
- Opens a dedicated NCSM subject page
- Exactly 12 subject cards
- Each subject has its own `Start Test` button
- Questions are loaded from Firestore using:
  - category = `NCSM`
  - subject = selected subject

Admin:
- Category now includes `NCSM`
- When NCSM is selected, an NCSM Subject dropdown appears
- Admin can add questions directly to any of the 12 subjects
- NCSM questions require a `subject` field
- JSON import supports the subject field
- Export includes the subject field

## Firestore question format

Example:

{
  "question": "What is a computer?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "category": "NCSM",
  "subject": "Computer Fundamentals",
  "explanation": "Explanation here"
}

## Important

The 12 subject names are defined at the top of `script.js` in `NCSM_SUBJECTS`.
Change those names if your official NCSM syllabus uses different subject names.

Existing General Knowledge and Competitive Exams remain supported.

Firebase configuration is retained from the supplied project.
