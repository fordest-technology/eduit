import { prisma } from "../lib/prisma";

async function fixExistingClasses() {
  console.log("🔧 Fixing existing classes to match new schema...\n");

  // Get all classes without section or levelId
  const classesNeedingFix = await prisma.class.findMany({
    where: {
      OR: [{ section: null }, { levelId: null }],
    },
    include: {
      level: true,
      school: true,
    },
  });

  console.log(`Found ${classesNeedingFix.length} classes that need fixing:\n`);

  for (const cls of classesNeedingFix) {
    console.log(`\nClass: ${cls.name}`);
    console.log(`  Current section: ${cls.section || "NULL"}`);
    console.log(`  Current levelId: ${cls.levelId || "NULL"}`);

    // If no section, set to "A" as default
    const section = cls.section || "A";

    // If no levelId, try to find or create a level based on class name
    let levelId = cls.levelId;

    if (!levelId) {
      // Try to match class name to existing levels
      const matchingLevel = await prisma.schoolLevel.findFirst({
        where: {
          schoolId: cls.schoolId,
          OR: [
            { name: { contains: cls.name, mode: "insensitive" } },
            { name: cls.name },
          ],
        },
      });

      if (matchingLevel) {
        levelId = matchingLevel.id;
        console.log(`  ✅ Found matching level: ${matchingLevel.name}`);
      } else {
        // Create a new level for this class
        const newLevel = await prisma.schoolLevel.create({
          data: {
            name: cls.name,
            order: 99, // Put at end
            schoolId: cls.schoolId,
          },
        });
        levelId = newLevel.id;
        console.log(`  ⚠️  Created new level: ${newLevel.name}`);
      }
    }

    // Update the class
    await prisma.class.update({
      where: { id: cls.id },
      data: {
        section: section.toUpperCase(),
        levelId,
      },
    });

    console.log(`  ✅ Updated: section=${section.toUpperCase()}, levelId=${levelId}`);
  }

  console.log("\n✅ All classes fixed!\n");
}

fixExistingClasses()
  .then(() => {
    console.log("🎉 Migration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
