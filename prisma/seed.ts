import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting FULL SCHOOL database seeding...");

  // Clear existing data (order matters for foreign keys)
  console.log("🗑️  Cleaning existing data...");
  await prisma.componentScore.deleteMany();
  await prisma.result.deleteMany();
  await prisma.studentClass.deleteMany();
  await prisma.studentPayment.deleteMany();
  await prisma.billAssignment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.schoolWallet.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.paymentAccount.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.subjectTeacher.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.resultPeriod.deleteMany();
  await prisma.assessmentComponent.deleteMany();
  await prisma.gradingScale.deleteMany();
  await prisma.resultConfiguration.deleteMany();
  await prisma.academicSession.deleteMany();
  await prisma.schoolLevel.deleteMany();
  await prisma.department.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create School
  console.log("🏫 Creating school...");
  const school = await prisma.school.create({
    data: {
      name: "St. Augustine Secondary School",
      shortName: "SASS",
      email: "admin@sass.edu.ng",
      address: "123 Education Avenue, Lagos",
      phone: "+234 801 234 5678",
      subdomain: "sass",
      primaryColor: "#4f46e5",
      secondaryColor: "#7c3aed",
      logo: "/school-logo.png",
    },
  });

  // 2. Create School Wallet
  console.log("💰 Creating school wallet...");
  const wallet = await prisma.schoolWallet.create({
    data: {
      schoolId: school.id,
      balance: 5750000, // ₦5.75M
      virtualAccountNo: "1234567890",
      virtualBankName: "Moniepoint MFB",
      providerRef: "EDUIT_" + school.id,
    },
  });

  // 3. Create Admin User
  console.log("👤 Creating admin user...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Dr. Adebayo Williams",
      email: "admin@sass.edu.ng",
      password: hashedPassword,
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
    },
  });

  await prisma.admin.create({
    data: {
      userId: adminUser.id,
      adminType: "SCHOOL_ADMIN",
    },
  });

  // 4. Create Academic Sessions
  console.log("📅 Creating academic sessions...");
  const oldSession = await prisma.academicSession.create({
    data: {
      name: "2023/2024",
      startDate: new Date("2023-09-01"),
      endDate: new Date("2024-07-31"),
      isCurrent: false,
      schoolId: school.id,
    },
  });

  const currentSession = await prisma.academicSession.create({
    data: {
      name: "2024/2025",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-07-31"),
      isCurrent: true,
      schoolId: school.id,
    },
  });

  // 5. Create Result Configuration for OLD SESSION
  console.log("⚙️  Creating result configuration...");
  const resultConfig = await prisma.resultConfiguration.create({
    data: {
      schoolId: school.id,
      sessionId: oldSession.id,
      cumulativeEnabled: true,
      cumulativeMethod: "progressive_average",
      showCumulativePerTerm: true,
    },
  });

  const term1 = await prisma.resultPeriod.create({
    data: { name: "1st Term", weight: 1, configurationId: resultConfig.id },
  });

  const term2 = await prisma.resultPeriod.create({
    data: { name: "2nd Term", weight: 1, configurationId: resultConfig.id },
  });

  const term3 = await prisma.resultPeriod.create({
    data: { name: "3rd Term", weight: 1, configurationId: resultConfig.id },
  });

  // 6. Create Departments
  console.log("🏢 Creating departments...");
  const scienceDept = await prisma.department.create({
    data: { name: "Science", description: "Science Department", schoolId: school.id },
  });

  const artsDept = await prisma.department.create({
    data: { name: "Arts", description: "Arts Department", schoolId: school.id },
  });

  const commerceDept = await prisma.department.create({
    data: { name: "Commercial", description: "Commercial Department", schoolId: school.id },
  });

  // 7. Create School Levels
  console.log("📊 Creating school levels...");
  const juniorLevel = await prisma.schoolLevel.create({
    data: { name: "Junior Secondary", description: "JSS 1-3", order: 1, schoolId: school.id },
  });

  const seniorLevel = await prisma.schoolLevel.create({
    data: { name: "Senior Secondary", description: "SS 1-3", order: 2, schoolId: school.id },
  });

  // 8. Create Teachers
  console.log("👨‍🏫 Creating 6 teachers...");
  const teachers = [];

  const teacherData = [
    { name: "Mr. Chukwudi Okafor", email: "c.okafor@sass.edu.ng", spec: "Mathematics", dept: scienceDept.id },
    { name: "Mrs. Blessing Adeyemi", email: "b.adeyemi@sass.edu.ng", spec: "English Language", dept: artsDept.id },
    { name: "Mr. Ahmed Ibrahim", email: "a.ibrahim@sass.edu.ng", spec: "Physics", dept: scienceDept.id },
    { name: "Miss Grace Nnamdi", email: "g.nnamdi@sass.edu.ng", spec: "Economics", dept: commerceDept.id },
    { name: "Dr. Samuel Okon", email: "s.okon@sass.edu.ng", spec: "Chemistry", dept: scienceDept.id },
    { name: "Mrs. Fatima Yusuf", email: "f.yusuf@sass.edu.ng", spec: "Literature", dept: artsDept.id },
  ];

  for (const [index, td] of teacherData.entries()) {
    const teacherUser = await prisma.user.create({
      data: {
        name: td.name,
        email: td.email,
        password: hashedPassword,
        role: "TEACHER",
        schoolId: school.id,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        employeeId: `TCH${String(index + 1).padStart(3, '0')}`,
        specialization: td.spec,
        departmentId: td.dept,
      },
    });

    teachers.push(teacher);
  }

  // 9. Create ALL Classes (JSS1-3, SS1-3)
  console.log("🎓 Creating 6 classes (JSS1-3, SS1-3)...");
  const classes = {
    jss1: await prisma.class.create({
      data: { name: "JSS 1", section: "Gold", schoolId: school.id, teacherId: teachers[0].id, levelId: juniorLevel.id },
    }),
    jss2: await prisma.class.create({
      data: { name: "JSS 2", section: "Gold", schoolId: school.id, teacherId: teachers[1].id, levelId: juniorLevel.id },
    }),
    jss3: await prisma.class.create({
      data: { name: "JSS 3", section: "Gold", schoolId: school.id, teacherId: teachers[2].id, levelId: juniorLevel.id },
    }),
    ss1: await prisma.class.create({
      data: { name: "SS 1", section: "Science", schoolId: school.id, teacherId: teachers[3].id, levelId: seniorLevel.id },
    }),
    ss2: await prisma.class.create({
      data: { name: "SS 2", section: "Science", schoolId: school.id, teacherId: teachers[4].id, levelId: seniorLevel.id },
    }),
    ss3: await prisma.class.create({
      data: { name: "SS 3", section: "Science", schoolId: school.id, teacherId: teachers[5].id, levelId: seniorLevel.id },
    }),
  };

  // 10. Create Core and Elective Subjects
  console.log("📚 Creating subjects...");
  const subjects = {
    // Core subjects (for all levels)
    math: await prisma.subject.create({
      data: { name: "Mathematics", code: "MTH101", schoolId: school.id, departmentId: scienceDept.id, isCore: true },
    }),
    english: await prisma.subject.create({
      data: { name: "English Language", code: "ENG101", schoolId: school.id, departmentId: artsDept.id, isCore: true },
    }),

    // Junior subjects
    basicScience: await prisma.subject.create({
      data: { name: "Basic Science", code: "SCI101", schoolId: school.id, departmentId: scienceDept.id, levelId: juniorLevel.id },
    }),
    basicTech: await prisma.subject.create({
      data: { name: "Basic Technology", code: "TCH101", schoolId: school.id, departmentId: scienceDept.id, levelId: juniorLevel.id },
    }),
    civics: await prisma.subject.create({
      data: { name: "Civic Education", code: "CIV101", schoolId: school.id, departmentId: artsDept.id, levelId: juniorLevel.id },
    }),

    // Senior subjects
    physics: await prisma.subject.create({
      data: { name: "Physics", code: "PHY201", schoolId: school.id, departmentId: scienceDept.id, levelId: seniorLevel.id },
    }),
    chemistry: await prisma.subject.create({
      data: { name: "Chemistry", code: "CHE201", schoolId: school.id, departmentId: scienceDept.id, levelId: seniorLevel.id },
    }),
    biology: await prisma.subject.create({
      data: { name: "Biology", code: "BIO201", schoolId: school.id, departmentId: scienceDept.id, levelId: seniorLevel.id },
    }),
    economics: await prisma.subject.create({
      data: { name: "Economics", code: "ECO201", schoolId: school.id, departmentId: commerceDept.id, levelId: seniorLevel.id },
    }),
  };

  // 11. Create 36 Students (6 per class)
  console.log("👨‍👩‍👧‍👦 Creating 36 students across all classes...");

  const studentsByClass = {
    jss1: [
      { first: "Chioma", last: "Nwosu", parent: "Mr. Emmanuel Nwosu", avg: 65 },
      { first: "Tunde", last: "Adeleke", parent: "Mrs. Funmilayo Adeleke", avg: 72 },
      { first: "Amina", last: "Mohammed", parent: "Alhaji Ibrahim Mohammed", avg: 58 },
      { first: "Emeka", last: "Obi", parent: "Dr. Chinedu Obi", avg: 45 },
      { first: "Blessing", last: "Eze", parent: "Pastor David Eze", avg: 80 },
      { first: "Ibrahim", last: "Yusuf", parent: "Mallam Yusuf Ibrahim", avg: 38 },
    ],
    jss2: [
      { first: "Grace", last: "Oladipo", parent: "Chief Oladipo Williams", avg: 55 },
      { first: "Daniel", last: "Okoro", parent: "Mrs. Joy Okoro", avg: 68 },
      { first: "Fatima", last: "Bello", parent: "Alhaji Bello Musa", avg: 75 },
      { first: "Michael", last: "Agu", parent: "Mr. Peter Agu", avg: 62 },
      { first: "Aisha", last: "Hassan", parent: "Dr. Hassan Abdullahi", avg: 70 },
      { first: "Victor", last: "Nnaji", parent: "Mrs. Ngozi Nnaji", avg: 48 },
    ],
    jss3: [
      { first: "Sarah", last: "Okeke", parent: "Mr. Chidi Okeke", avg: 82 },
      { first: "James", last: "Adamu", parent: "Prof. Adamu Bala", avg: 77 },
      { first: "Zainab", last: "Usman", parent: "Mrs. Halima Usman", avg: 65 },
      { first: "David", last: "Okafor", parent: "Engr. Paul Okafor", avg: 58 },
      { first: "Mercy", last: "Eze", parent: "Rev. Samuel Eze", avg: 88 },
      { first: "Abdul", last: "Suleiman", parent: "Mallam Suleiman Ahmad", avg: 54 },
    ],
    ss1: [
      { first: "Chinedu", last: "Onyeka", parent: "Dr. Onyeka Francis", avg: 72 },
      { first: "Halima", last: "Ibrahim", parent: "Alhaji Ibrahim Musa", avg: 68 },
      { first: "Emmanuel", last: "Udoh", parent: "Mr. Udoh Bassey", avg: 75 },
      { first: "Chinwe", last: "Okafor", parent: "Mrs. Ifeoma Okafor", avg: 80 },
      { first: "Yusuf", last: "Abdullahi", parent: "Mallam Abdullahi Garba", avg: 62 },
      { first: "Joy", last: "Nnamdi", parent: "Chief Nnamdi Okoro", avg: 55 },
    ],
    ss2: [
      { first: "Peter", last: "Eze", parent: "Bishop Eze Michael", avg: 78 },
      { first: "Khadija", last: "Bello", parent: "Dr. Bello Yusuf", avg: 84 },
      { first: "Paul", last: "Okonkwo", parent: "Prof. Okonkwo Chidi", avg: 70 },
      { first: "Ngozi", last: "Nnaji", parent: "Mrs. Amaka Nnaji", avg: 65 },
      { first: "Musa", last: "Abubakar", parent: "Alhaji Abubakar Sadiq", avg: 58 },
      { first: "Esther", last: "Udofia", parent: "Mr. Udofia Clement", avg: 75 },
    ],
    ss3: [
      { first: "Augustine", last: "Obi", parent: "Mr. Obi Nwabueze", avg: 86 },
      { first: "Hauwa", last: "Garba", parent: "Mallam Garba Tijjani", avg: 82 },
      { first: "Samuel", last: "Onyeka", parent: "Dr. Onyeka Paul", avg: 76 },
      { first: "Chidinma", last: "Nwankwo", parent: "Chief Nwankwo Emeka", avg: 90 },
      { first: "Usman", last: "Lawal", parent: "Alhaji Lawal Usman", avg: 68 },
      { first: "Patience", last: "Okoro", parent: "Mrs. Okoro Nnenna", avg: 72 },
    ],
  };

  const allStudents = [];
  const juniorSubjects = [subjects.math, subjects.english, subjects.basicScience, subjects.basicTech, subjects.civics];
  const seniorSubjects = [subjects.math, subjects.english, subjects.physics, subjects.chemistry, subjects.biology, subjects.economics];

  for (const [className, studentList] of Object.entries(studentsByClass)) {
    const classObj = classes[className as keyof typeof classes];
    const isJunior = className.startsWith('jss');
    const classSubjects = isJunior ? juniorSubjects : seniorSubjects;

    for (const studentData of studentList) {
      // Create parent
      const parentUser = await prisma.user.create({
        data: {
          name: studentData.parent,
          email: `${studentData.last.toLowerCase()}.${studentData.first.toLowerCase()}@gmail.com`,
          password: hashedPassword,
          role: "PARENT",
          schoolId: school.id,
        },
      });

      const parent = await prisma.parent.create({
        data: {
          userId: parentUser.id,
          phone: "+234 " + Math.floor(800000000 + Math.random() * 100000000),
        },
      });

      // Create student
      const studentUser = await prisma.user.create({
        data: {
          name: `${studentData.first} ${studentData.last}`,
          email: `${studentData.first.toLowerCase()}.${studentData.last.toLowerCase()}@sass.edu.ng`,
          password: hashedPassword,
          role: "STUDENT",
          schoolId: school.id,
        },
      });

      const student = await prisma.student.create({
        data: {
          userId: studentUser.id,
          admissionDate: new Date("2023-09-01"),
          departmentId: isJunior ? null : scienceDept.id,
        },
      });

      // Link student to parent
      await prisma.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          relation: studentData.parent.includes("Mr.") || studentData.parent.includes("Alhaji") ? "Father" : "Mother",
          isPrimary: true,
        },
      });

      // Enroll in OLD session
      await prisma.studentClass.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          sessionId: oldSession.id,
          status: "ACTIVE",
        },
      });

      // For JSS3 and SS3, also enroll in CURRENT session (they're continuing)
      if (className === 'jss3' || className === 'ss3') {
        await prisma.studentClass.create({
          data: {
            studentId: student.id,
            classId: classObj.id,
            sessionId: currentSession.id,
            status: "ACTIVE",
          },
        });
      }

      allStudents.push({ ...student, targetAvg: studentData.avg, className, subjects: classSubjects });
    }
  }

  // 12. Create Results for all students in OLD SESSION
  console.log("📝 Creating student results (540 total records)...");

  const terms = [term1, term2, term3];

  for (const student of allStudents) {
    for (const term of terms) {
      for (const subject of student.subjects) {
        const baseScore = student.targetAvg;
        const variance = Math.random() * 20 - 10;
        const score = Math.max(0, Math.min(100, baseScore + variance));

        await prisma.result.create({
          data: {
            studentId: student.id,
            subjectId: subject.id,
            sessionId: oldSession.id,
            periodId: term.id,
            total: Math.round(score),
            grade: score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : score >= 40 ? "D" : "F",
            remark: score >= 70 ? "Excellent" : score >= 60 ? "Very Good" : score >= 50 ? "Good" : score >= 40 ? "Pass" : "Fail",
            teacherComment: score >= 60 ? "Keep up the good work!" : "More effort needed.",
          },
        });
      }
    }
  }

  // 13. Create Payment Account and Bills
  console.log("💳 Creating payment account and bills...");
  const paymentAccount = await prisma.paymentAccount.create({
    data: {
      name: "School Collection Account",
      accountNo: "1234567890",
      bankName: "Moniepoint MFB",
      schoolId: school.id,
      isActive: true,
    },
  });

  const jss1Fee = await prisma.bill.create({
    data: {
      name: "JSS 1 Term Fees",
      amount: 75000,
      schoolId: school.id,
      accountId: paymentAccount.id,
    },
  });

  const ss3Fee = await prisma.bill.create({
    data: {
      name: "SS 3 WAEC Fees",
      amount: 125000,
      schoolId: school.id,
      accountId: paymentAccount.id,
    },
  });

  // 14. Create Wallet Transactions
  console.log("💸 Creating wallet transactions...");

  await prisma.walletTransaction.createMany({
    data: [
      {
        walletId: wallet.id,
        amount: 75000,
        type: "CREDIT",
        status: "SUCCESS",
        reference: "PAY-20250102-001",
        description: "JSS1 Payment - Chioma Nwosu",
      },
      {
        walletId: wallet.id,
        amount: 125000,
        type: "CREDIT",
        status: "SUCCESS",
        reference: "PAY-20250102-002",
        description: "SS3 WAEC - Augustine Obi",
      },
      {
        walletId: wallet.id,
        amount: 1500000,
        type: "DEBIT",
        status: "SUCCESS",
        reference: "WD-20250103-001",
        description: "Withdrawal to GTBank",
      },
      {
        walletId: wallet.id,
        amount: 5250000,
        type: "CREDIT",
        status: "SUCCESS",
        reference: "PAY-20250103-002",
        description: "Bulk term payment",
      },
      {
        walletId: wallet.id,
        amount: 1800000,
        type: "CREDIT",
        status: "PENDING",
        reference: "PAY-20250104-001",
        description: "Pending transfer",
      },
    ],
  });

  console.log("✅ FULL SCHOOL Database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`   🏫 School: ${school.name}`);
  console.log(`   👥 Students: 36 (6 per class)`);
  console.log(`   📚 Classes: 6 (JSS1, JSS2, JSS3, SS1, SS2, SS3)`);
  console.log(`   👨‍🏫 Teachers: 6`);
  console.log(`   📚 Subjects: 9`);
  console.log(`   📝 Results: 540 records (36 students × 5 avg subjects × 3 terms)`);
  console.log(`   💰 Wallet Balance: ₦${wallet.balance.toLocaleString()}`);
  console.log(`   💳 Transactions: 5`);
  console.log("\n🎓 Distribution:");
  console.log("   JSS1: 6 students");
  console.log("   JSS2: 6 students");
  console.log("   JSS3: 6 students (also in 2024/2025)");
  console.log("   SS1:  6 students");
  console.log("   SS2:  6 students");
  console.log("   SS3:  6 students (also in 2024/2025)");
  console.log("\n🔑 Login Credentials:");
  console.log(`   Admin: admin@sass.edu.ng / password123`);
  console.log(`   Teacher: c.okafor@sass.edu.ng / password123`);
  console.log(`   JSS1 Student: chioma.nwosu@sass.edu.ng / password123`);
  console.log(`   SS3 Student: augustine.obi@sass.edu.ng / password123`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
