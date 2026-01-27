import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkParent() {
  const id = "cmkj1c4qr002zsw80rrkjylzk";
  const user = await prisma.user.findUnique({
    where: { id },
    include: { parent: true }
  });

  console.log("User:", user ? { id: user.id, name: user.name, role: user.role } : "Not found");
  console.log("Parent profile:", user?.parent ? "Found" : "Not found");
  
  if (user?.schoolId) {
    const school = await prisma.school.findUnique({ where: { id: user.schoolId } });
    console.log("School:", school?.name);
  }

  const students = await prisma.student.findMany({
      take: 5,
      include: { user: true }
  });
  console.log("Sample Students:", students.map(s => ({ id: s.id, userId: s.user.id, name: s.user.name })));
}

checkParent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
