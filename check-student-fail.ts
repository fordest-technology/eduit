import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSpecificStudent() {
  const userId = "cmkj1c63f0033sw80z2j7uua2";
  
  console.log(`Checking for User ID: ${userId}`);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true }
  });

  if (!user) {
    console.log("❌ User record NOT found in database.");
  } else {
    console.log("✅ User record found:");
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   School ID: ${user.schoolId}`);
    
    if (user.student) {
      console.log("✅ Student profile record found:");
      console.log(`   Student Profile ID: ${user.student.id}`);
    } else {
      console.log("❌ Student profile record NOT found for this user.");
    }
  }

  // Also check if this ID exists but as a Student.id instead of User.id
  const studentById = await prisma.student.findUnique({
    where: { id: userId },
    include: { user: true }
  });

  if (studentById) {
    console.log("🔍 Found as a Student Record ID (Student.id):");
    console.log(`   User Name: ${studentById.user.name}`);
  }
}

checkSpecificStudent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
