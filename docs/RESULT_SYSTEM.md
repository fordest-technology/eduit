# EduIT Result Management System

## Overview

The Result Management System is a comprehensive module for recording, processing, and publishing student assessment scores. It supports a granular scoring model where component scores (Tests, Exams, Projects) are aggregated into a final subject result.

## Architecture

### Database Models

1.  **Result**: Stores the final score (`total`, `grade`, `remark`) for a specific student, subject, and period (term).
2.  **ComponentScore**: Stores the breakdown of scores for each assessment component (e.g., "CA1: 15/20").
3.  **AssessmentComponent**: Defines the types of assessments (e.g., "Test", "Exam") and their maximum scores.
4.  **ResultConfiguration**: Configures the academic structure (Periods, Grading Scales) for the school.
5.  **SubjectTeacher**: Links teachers to subjects, enabling permission checks.
6.  **ClassSubject**: Defines which subjects are offered in a class.

### Key Workflows

#### 1. Configuration (Admin)

- Admins configure **Assessment Components** (e.g., CA 30%, Exam 70%).
- Admins set up **Grading Scales** (e.g., A = 70-100).
- Admins define **Result Periods** (Terms).

#### 2. Result Entry (Teachers)

- **Batch Entry**: Teachers enter scores for an entire class/subject grid.
- **Permissions**:
  - Teachers can only edit results for subjects they are assigned to (verified via `SubjectTeacher`).
  - Teachers can only access classes where the subject is offered.
- **Data Flow**:
  - Frontend sends a batch of score updates to `/api/schools/[id]/results/batch`.
  - Backend validates permissions and data integrity.
  - Backend calculates `total` score by summing component scores.
  - Backend determines `grade` and `remark` based on the active `GradingScale`.
  - `Result` and `ComponentScore` records are upserted.

#### 3. Publication (Admin)

- Admins review result statistics (Published vs Unpublished).
- Admins "Publish" results for a specific session/term.
- **Notifications**: System automatically emails students and parents when results are published.

## API Endpoints

### `GET /api/schools/[id]/results/batch`

Fetches a matrix of results for a given class/subject/period.

- **Query Params**: `periodId`, `sessionId`, `classId`, `subjectId`.
- **Response**: List of `Result` objects with nested `componentScores`.

### `POST /api/schools/[id]/results/batch`

Submits score updates for multiple students.

- **Body**: `{ results: { studentId, subjectId, componentScores: [...] }[] }`
- **Logic**:
  - Validates teacher permissions.
  - Upserts `Result`.
  - Replaces `ComponentScore` records.
  - Auto-calculates totals and grades.

### `POST /api/admin/results/publish`

Publishes results for a session/term.

- **Body**: `{ sessionId, periodId, classId? }`
- **Logic**: Sets `published = true` and triggers email notifications.

## Permissions

| Role             | Access                               |
| ---------------- | ------------------------------------ |
| **SUPER_ADMIN**  | Full Access (Config, Entry, Publish) |
| **SCHOOL_ADMIN** | Full Access (Config, Entry, Publish) |
| **TEACHER**      | Entry (Assigned Subjects Only)       |
| **STUDENT**      | View Own (Published Only)            |
| **PARENT**       | View Children (Published Only)       |

## Future Improvements

- **Broadsheet Generation**: PDF export of all results for a class.
- **Result Templates**: Customizable report card layouts.
- **Historical Editing**: Better handling of student class history.
