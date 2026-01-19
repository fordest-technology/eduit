
import { Prisma } from "@prisma/client";

type PrismaTx = Prisma.TransactionClient;

/**
 * Applies a standard configuration template to a new school.
 * Creates levels, classes, departments, and the current academic session.
 */
export async function applySchoolTemplate(
  tx: PrismaTx,
  schoolId: string,
  type: "primary" | "secondary" | "combined" | string
) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11

  // Determine Session Name (e.g., 2023/2024 starts in Sept 2023)
  // If month is >= 8 (September), we are in the start of a year.
  // Else we are in the second half.
  let startYear = currentYear;
  if (currentMonth < 8) {
    startYear = currentYear - 1;
  }
  const sessionName = `${startYear}/${startYear + 1}`;

  // 1. Create Academic Session
  const session = await tx.academicSession.create({
    data: {
      name: sessionName,
      schoolId,
      startDate: new Date(startYear, 8, 1), // Sept 1st
      endDate: new Date(startYear + 1, 6, 30), // July 30th
      isCurrent: true,
    }
  });

  // 2. Create Departments
  // General is standard. For Secondary, we might want Science/Art/Commercial later, 
  // but "General" is a safe default for strictly class-based systems unless specified.

  const generalDept = await tx.department.create({
    data: { name: "General", schoolId }
  });


  let scienceDept, artsDept, commercialDept;
  if (type === "secondary" || type === "combined") {
    scienceDept = await tx.department.create({ data: { name: "Science", schoolId } });
    artsDept = await tx.department.create({ data: { name: "Arts", schoolId } });
    commercialDept = await tx.department.create({ data: { name: "Commercial", schoolId } });
  }

  // 3. Define Structure
  const levels = [];

  if (type === "primary" || type === "combined") {
    levels.push(
      { name: "Nursery", classes: ["Nursery 1", "Nursery 2", "Nursery 3"] },
      { name: "Primary", classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"] }
    );
  }

  if (type === "secondary" || type === "combined") {
    levels.push(
      { name: "Junior Secondary", classes: ["JSS 1", "JSS 2", "JSS 3"] },
      { name: "Senior Secondary", classes: ["SSS 1", "SSS 2", "SSS 3"] }
    );
  }

  // 4. Create Levels and Classes
  let order = 1;
  for (const levelDef of levels) {
    const level = await tx.schoolLevel.create({
      data: {
        name: levelDef.name,
        schoolId,
        order: order++
      }
    });

    for (const className of levelDef.classes) {
      await tx.class.create({
        data: {
          name: className,
          school: { connect: { id: schoolId } },
          level: { connect: { id: level.id } },
          sessions: {
            connect: [{ id: session.id }]
          }
        }
      });
    }
  }

  // 5. Create Default Result Configuration
  await tx.resultConfiguration.create({
    data: {
      schoolId,
      sessionId: session.id,
      cumulativeEnabled: true,
      periods: {
        create: [
          { name: "First Term", weight: 1 },
          { name: "Second Term", weight: 1 },
          { name: "Third Term", weight: 1 },
        ]
      },
      gradingScale: {
        create: [
          { minScore: 75, maxScore: 100, grade: "A", remark: "Excellent" },
          { minScore: 65, maxScore: 74.9, grade: "B", remark: "Very Good" },
          { minScore: 50, maxScore: 64.9, grade: "C", remark: "Credit" },
          { minScore: 45, maxScore: 49.9, grade: "D", remark: "Pass" },
          { minScore: 40, maxScore: 44.9, grade: "E", remark: "Fair" },
          { minScore: 0, maxScore: 39.9, grade: "F", remark: "Fail" },
        ]
      },
      assessmentComponents: {
        create: [
          { name: "Test", key: "test", maxScore: 30 },
          { name: "Exam", key: "exam", maxScore: 70 },
        ]
      }
    }
  });

  return { session };
}
