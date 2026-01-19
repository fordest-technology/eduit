import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("🚀 Starting Educational Data Cleanup...");

  try {
    // 1. Delete Results and Attendance (Child-most records)
    console.log("🗑️  Cleaning up Results and Attendance...");
    await prisma.result.deleteMany({});
    await prisma.attendance.deleteMany({});

    // 2. Delete Student related operational data
    console.log("🗑️  Cleaning up Student Classes and Subjects...");
    await prisma.studentClass.deleteMany({});
    await prisma.studentSubject.deleteMany({});
    
    // 3. Delete Subject related operational data
    console.log("🗑️  Cleaning up Class Subjects and Subject Teachers...");
    await prisma.classSubject.deleteMany({});
    await prisma.subjectTeacher.deleteMany({});

    // 4. Delete Classes (now that relations are gone)
    console.log("🗑️  Cleaning up Classes...");
    await prisma.class.deleteMany({});

    // 5. Delete Subjects
    console.log("🗑️  Cleaning up Subjects...");
    await prisma.subject.deleteMany({});

    // 6. Delete Academic Sessions (except current maybe? no, lets clear all to start fresh)
    console.log("🗑️  Cleaning up Academic Sessions...");
    // await prisma.academicSession.deleteMany({}); 
    // Actually, keep sessions but maybe clear class relations (already done by deleteMany on Class)

    console.log("✅ Cleanup Complete! You have a fresh slate for testing classes and subjects.");
    console.log("Note: School Levels, Departments, and Users (Teachers/Students) were preserved.");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
