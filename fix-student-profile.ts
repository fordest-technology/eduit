import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixStudentProfile() {
  const userId = "cmkj1c63f0033sw80z2j7uua2";
  
  console.log(`Fixing student profile for User ID: ${userId}`);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true }
  });

  if (!user) {
    console.log("❌ User not found.");
    return;
  }

  if (user.student) {
    console.log("✅ Student profile already exists.");
    return;
  }

  try {
    const newStudent = await prisma.student.create({
      data: {
        userId: user.id,
        // Optional fields can be null/undefined initially
      }
    });
    console.log("✅ Created missing student profile successfully:", newStudent.id);
  } catch (error) {
    console.error("❌ Failed to create student profile:", error);
  }
}

fixStudentProfile()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
