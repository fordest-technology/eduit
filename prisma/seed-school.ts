import { PrismaClient, UserRole, BillAssignmentType, BillStatus, EnrollmentStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const SCHOOL_ID = "cmk03wg1o0000sw1swjojdohs";

async function main() {
  console.log(`Starting seed for school: ${SCHOOL_ID}`);

  const school = await prisma.school.findUnique({
    where: { id: SCHOOL_ID },
  });

  if (!school) {
    console.error(`School with ID ${SCHOOL_ID} not found. Please check the ID.`);
    return;
  }

  // 0. Cleanup existing data for this school (in correct order)
  console.log("Cleaning up existing data for this school...");
  
  // Find all users of this school to clean them up specifically
  const schoolUsers = await prisma.user.findMany({
    where: { schoolId: SCHOOL_ID },
    select: { id: true }
  });
  const userIds = schoolUsers.map(u => u.id);

  // Note: We don't delete the School itself, just its children
  await prisma.studentClass.deleteMany({ where: { student: { user: { schoolId: SCHOOL_ID } } } });
  await prisma.studentParent.deleteMany({ where: { student: { user: { schoolId: SCHOOL_ID } } } });
  await prisma.studentSubject.deleteMany({ where: { student: { user: { schoolId: SCHOOL_ID } } } });
  await prisma.subjectTeacher.deleteMany({ where: { subject: { schoolId: SCHOOL_ID } } });
  await prisma.classSubject.deleteMany({ where: { class: { schoolId: SCHOOL_ID } } });
  await prisma.attendance.deleteMany({ where: { student: { user: { schoolId: SCHOOL_ID } } } });
  await prisma.result.deleteMany({ where: { session: { schoolId: SCHOOL_ID } } });
  await prisma.billItem.deleteMany({ where: { bill: { schoolId: SCHOOL_ID } } });
  await prisma.bill.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.paymentAccount.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.subject.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.class.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.department.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.schoolLevel.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.academicSession.deleteMany({ where: { schoolId: SCHOOL_ID } });
  
  // Delete profiles and then users
  await prisma.student.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.parent.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.teacher.deleteMany({ where: { userId: { in: userIds } } });
  // Skip deleting the actual users for now to avoid breaking the current session if the admin is one of them,
  // unless they are not SCHOOL_ADMINs. Actually, let's just delete the ones we will recreate.
  await prisma.user.deleteMany({ 
    where: { 
        schoolId: SCHOOL_ID,
        role: { in: [UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER] }
    } 
  });

  const password = await hash("password123", 10);

  // 1. Academic Session
  console.log("Seeding Academic Session...");
  const session = await prisma.academicSession.create({
    data: {
      name: "2024/2025 Academic Session",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-07-31"),
      isCurrent: true,
      schoolId: SCHOOL_ID,
    },
  });

  // 2. Levels
  console.log("Seeding Levels...");
  const levelsData = [
    { name: "JSS 1", order: 1 },
    { name: "JSS 2", order: 2 },
    { name: "JSS 3", order: 3 },
    { name: "SSS 1", order: 4 },
    { name: "SSS 2", order: 5 },
    { name: "SSS 3", order: 6 },
  ];

  const levels = [];
  for (const level of levelsData) {
    const l = await prisma.schoolLevel.upsert({
      where: { schoolId_name: { schoolId: SCHOOL_ID, name: level.name } },
      update: { order: level.order },
      create: {
        name: level.name,
        order: level.order,
        schoolId: SCHOOL_ID,
      },
    });
    levels.push(l);
  }

  // 3. Departments
  console.log("Seeding Departments...");
  const departmentsData = ["Science", "Arts", "Commercial", "General"];
  const departments = [];
  for (const deptName of departmentsData) {
    const d = await prisma.department.create({
      data: {
        name: deptName,
        schoolId: SCHOOL_ID,
      },
    });
    departments.push(d);
  }

  // 4. Classes
  console.log("Seeding Classes...");
  const classes = [];
  for (const level of levels) {
    for (const section of ["A", "B"]) {
      const c = await prisma.class.create({
        data: {
          name: `${level.name}${section}`,
          section: section,
          schoolId: SCHOOL_ID,
          levelId: level.id,
        },
      });
      classes.push(c);
    }
  }

  // 5. Subjects
  console.log("Seeding Subjects...");
  const subjectsData = [
    { name: "Mathematics", code: "MATH" },
    { name: "English Language", code: "ENG" },
    { name: "Physics", code: "PHY", dept: "Science" },
    { name: "Chemistry", code: "CHM", dept: "Science" },
    { name: "Biology", code: "BIO", dept: "Science" },
    { name: "Literature in English", code: "LIT", dept: "Arts" },
    { name: "Government", code: "GOV", dept: "Arts" },
    { name: "Economics", code: "ECO", dept: "Commercial" },
    { name: "Financial Accounting", code: "ACC", dept: "Commercial" },
  ];

  const subjects = [];
  for (const sub of subjectsData) {
    const dept = departments.find(d => d.name === (sub.dept || "General"));
    const s = await prisma.subject.create({
      data: {
        name: sub.name,
        code: `${sub.code}-${SCHOOL_ID.substring(0, 4)}`,
        schoolId: SCHOOL_ID,
        departmentId: dept?.id,
      },
    });
    subjects.push(s);

    // Assign to some classes
    for (const cls of classes) {
       await prisma.classSubject.create({
         data: {
           classId: cls.id,
           subjectId: s.id
         }
       })
    }
  }

  // 6. Teachers
  console.log("Seeding Teachers...");
  for (let i = 1; i <= 5; i++) {
    const email = `teacher${i}@${school.subdomain}.edu.it`;
    const user = await prisma.user.create({
      data: {
        email,
        name: `Teacher ${i}`,
        password,
        role: UserRole.TEACHER,
        schoolId: SCHOOL_ID,
        teacher: {
          create: {
            employeeId: `TCH${i}-${SCHOOL_ID.substring(0, 4)}`,
            specialization: "Education",
          }
        }
      },
      include: { teacher: true }
    });
    
    // Assign subject
    if (user.teacher) {
        await prisma.subjectTeacher.create({
            data: {
                subjectId: subjects[i % subjects.length].id,
                teacherId: user.teacher.id
            }
        });
    }
  }

  // 7. Parents & Students
  console.log("Seeding Parents and Students...");
  for (let i = 1; i <= 10; i++) {
    const parentEmail = `parent${i}@${school.subdomain}.edu.it`;
    const parentUser = await prisma.user.create({
      data: {
        email: parentEmail,
        name: `Parent ${i}`,
        password,
        role: UserRole.PARENT,
        schoolId: SCHOOL_ID,
        parent: { create: {} }
      },
      include: { parent: true }
    });

    const studentEmail = `student${i}@${school.subdomain}.edu.it`;
    const studentUser = await prisma.user.create({
      data: {
        email: studentEmail,
        name: `Student ${i}`,
        password,
        role: UserRole.STUDENT,
        schoolId: SCHOOL_ID,
        student: {
          create: {
            admissionDate: new Date(),
          }
        }
      },
      include: { student: true }
    });

    if (parentUser.parent && studentUser.student) {
      await prisma.studentParent.create({
        data: {
          parentId: parentUser.parent.id,
          studentId: studentUser.student.id,
          relation: "Father",
          isPrimary: true
        }
      });

      // Assign to class
      const cls = classes[i % classes.length];
      await prisma.studentClass.create({
        data: {
          studentId: studentUser.student.id,
          classId: cls.id,
          sessionId: session.id,
          status: EnrollmentStatus.ACTIVE
        }
      });
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
