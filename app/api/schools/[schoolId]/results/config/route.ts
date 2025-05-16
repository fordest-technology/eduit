import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// Define types for raw query results
interface ConfigResult {
  id: string;
  schoolId: string;
  sessionId: string;
  cumulativeEnabled: boolean;
  cumulativeMethod: string;
  showCumulativePerTerm: boolean;
  academicYear?: string;
}

interface PeriodResult {
  id: string;
  name: string;
  weight: number;
}

interface ComponentResult {
  id: string;
  name: string;
  key: string;
  maxScore: number;
}

interface GradingScaleResult {
  id: string;
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
}

interface RawIdResult {
  id: string;
}

const configurationSchema = z.object({
  academicYear: z.string(),
  periods: z.array(
    z.object({
      name: z.string(),
      weight: z.number().default(1),
    })
  ),
  assessmentComponents: z.array(
    z.object({
      name: z.string(),
      key: z.string(),
      maxScore: z.number(),
    })
  ),
  gradingScale: z.array(
    z.object({
      minScore: z.number(),
      maxScore: z.number(),
      grade: z.string(),
      remark: z.string(),
    })
  ),
  cumulativeEnabled: z.boolean().default(true),
  cumulativeMethod: z.string().default("progressive_average"),
  showCumulativePerTerm: z.boolean().default(true),
});

export async function POST(
  request: Request,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = configurationSchema.parse(body);

    // Get session ID from academic year name
    const academicSession = await prisma.academicSession.findFirst({
      where: {
        name: validatedData.academicYear,
        schoolId: params.schoolId,
      },
      select: {
        id: true,
      },
    });

    if (!academicSession) {
      return NextResponse.json(
        { error: "Academic session not found" },
        { status: 400 }
      );
    }

    // Create configuration using raw SQL
    const configIdResult = await prisma.$queryRaw<RawIdResult[]>`
      INSERT INTO "ResultConfiguration" 
      ("id", "schoolId", "sessionId", "cumulativeEnabled", "cumulativeMethod", "showCumulativePerTerm", "createdAt", "updatedAt")
      VALUES 
      (gen_random_uuid(), ${params.schoolId}, ${academicSession.id}, 
       ${validatedData.cumulativeEnabled}, ${validatedData.cumulativeMethod}, 
       ${validatedData.showCumulativePerTerm}, NOW(), NOW())
      RETURNING id
    `;

    if (!Array.isArray(configIdResult) || configIdResult.length === 0) {
      throw new Error("Failed to create configuration");
    }

    const newConfigId = configIdResult[0].id;

    // Insert periods
    for (const period of validatedData.periods) {
      await prisma.$executeRaw`
        INSERT INTO "ResultPeriod" 
        ("id", "name", "weight", "configurationId", "createdAt", "updatedAt")
        VALUES 
        (gen_random_uuid(), ${period.name}, ${period.weight}, ${newConfigId}, NOW(), NOW())
      `;
    }

    // Insert assessment components
    for (const component of validatedData.assessmentComponents) {
      await prisma.$executeRaw`
        INSERT INTO "AssessmentComponent" 
        ("id", "name", "key", "maxScore", "configurationId", "createdAt", "updatedAt")
        VALUES 
        (gen_random_uuid(), ${component.name}, ${component.key}, ${component.maxScore},
         ${newConfigId}, NOW(), NOW())
      `;
    }

    // Insert grading scale
    for (const scale of validatedData.gradingScale) {
      await prisma.$executeRaw`
        INSERT INTO "GradingScale" 
        ("id", "minScore", "maxScore", "grade", "remark", "configurationId", "createdAt", "updatedAt")
        VALUES 
        (gen_random_uuid(), ${scale.minScore}, ${scale.maxScore}, ${scale.grade},
         ${scale.remark}, ${newConfigId}, NOW(), NOW())
      `;
    }

    // Get the complete configuration
    const configResult = await prisma.$queryRaw<ConfigResult[]>`
      SELECT 
        rc."id", rc."schoolId", rc."sessionId", 
        rc."cumulativeEnabled", 
        rc."cumulativeMethod",
        rc."showCumulativePerTerm",
        s."name" AS "academicYear"
      FROM "ResultConfiguration" rc
      JOIN "AcademicSession" s ON rc."sessionId" = s."id"
      WHERE rc."id" = ${newConfigId}
    `;

    if (!Array.isArray(configResult) || configResult.length === 0) {
      throw new Error("Failed to retrieve created configuration");
    }

    // Get periods
    const periodsResult = await prisma.$queryRaw<PeriodResult[]>`
      SELECT rp."id", rp."name", rp."weight" FROM "ResultPeriod" rp WHERE rp."configurationId" = ${newConfigId}
    `;

    // Get components
    const componentsResult = await prisma.$queryRaw<ComponentResult[]>`
      SELECT ac."id", ac."name", ac."key", ac."maxScore" FROM "AssessmentComponent" ac 
      WHERE ac."configurationId" = ${newConfigId}
    `;

    // Get grading scale
    const gradingScaleResult = await prisma.$queryRaw<GradingScaleResult[]>`
      SELECT gs."id", gs."minScore", gs."maxScore", gs."grade", gs."remark" 
      FROM "GradingScale" gs WHERE gs."configurationId" = ${newConfigId}
    `;

    const periods = Array.isArray(periodsResult) ? periodsResult : [];
    const components = Array.isArray(componentsResult) ? componentsResult : [];
    const gradingScale = Array.isArray(gradingScaleResult)
      ? gradingScaleResult
      : [];

    return NextResponse.json({
      ...configResult[0],
      periods,
      assessmentComponents: components,
      gradingScale,
    });
  } catch (error) {
    console.error("Error creating result configuration:", error);
    return NextResponse.json(
      {
        error: "Failed to create result configuration",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all configurations for the school
    const configsResult = await prisma.$queryRaw<ConfigResult[]>`
      SELECT 
        rc."id", rc."schoolId", rc."sessionId", 
        rc."cumulativeEnabled", 
        rc."cumulativeMethod",
        rc."showCumulativePerTerm",
        s."name" AS "academicYear" 
      FROM "ResultConfiguration" rc
      JOIN "AcademicSession" s ON rc."sessionId" = s."id"
      WHERE rc."schoolId" = ${params.schoolId}
      ORDER BY rc."createdAt" DESC
    `;

    const configs = Array.isArray(configsResult) ? configsResult : [];

    // Get all data for each configuration
    const results = await Promise.all(
      configs.map(async (config: ConfigResult) => {
        // Get periods
        const periodsQuery = await prisma.$queryRaw<PeriodResult[]>`
          SELECT rp."id", rp."name", rp."weight" FROM "ResultPeriod" rp WHERE rp."configurationId" = ${config.id}
        `;

        // Get components
        const componentsQuery = await prisma.$queryRaw<ComponentResult[]>`
          SELECT ac."id", ac."name", ac."key", ac."maxScore" FROM "AssessmentComponent" ac 
          WHERE ac."configurationId" = ${config.id}
        `;

        // Get grading scale
        const gradingScaleQuery = await prisma.$queryRaw<GradingScaleResult[]>`
          SELECT gs."id", gs."minScore", gs."maxScore", gs."grade", gs."remark" 
          FROM "GradingScale" gs WHERE gs."configurationId" = ${config.id}
        `;

        const periods = Array.isArray(periodsQuery) ? periodsQuery : [];
        const components = Array.isArray(componentsQuery)
          ? componentsQuery
          : [];
        const gradingScale = Array.isArray(gradingScaleQuery)
          ? gradingScaleQuery
          : [];

        return {
          ...config,
          periods,
          assessmentComponents: components,
          gradingScale,
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching result configurations:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch result configurations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;
    const validatedData = configurationSchema.parse(data);

    // Get session ID from academic year name
    const academicSession = await prisma.academicSession.findFirst({
      where: {
        name: validatedData.academicYear,
        schoolId: params.schoolId,
      },
      select: {
        id: true,
      },
    });

    if (!academicSession) {
      return NextResponse.json(
        { error: "Academic session not found" },
        { status: 400 }
      );
    }

    // Update configuration
    await prisma.$executeRaw`
      UPDATE "ResultConfiguration"
      SET 
        "cumulativeEnabled" = ${validatedData.cumulativeEnabled},
        "cumulativeMethod" = ${validatedData.cumulativeMethod},
        "showCumulativePerTerm" = ${validatedData.showCumulativePerTerm},
        "updatedAt" = NOW()
      WHERE "id" = ${id}
    `;

    // Delete existing related records
    await prisma.$executeRaw`DELETE FROM "ResultPeriod" WHERE "configurationId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "AssessmentComponent" WHERE "configurationId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "GradingScale" WHERE "configurationId" = ${id}`;

    // Insert periods
    for (const period of validatedData.periods) {
      await prisma.$executeRaw`
        INSERT INTO "ResultPeriod" 
        ("id", "name", "weight", "configurationId", "createdAt", "updatedAt")
        VALUES 
        (gen_random_uuid(), ${period.name}, ${period.weight}, ${id}, NOW(), NOW())
      `;
    }

    // Insert assessment components
    for (const component of validatedData.assessmentComponents) {
      await prisma.$executeRaw`
        INSERT INTO "AssessmentComponent" 
        ("id", "name", "key", "maxScore", "configurationId", "createdAt", "updatedAt")
        VALUES 
        (gen_random_uuid(), ${component.name}, ${component.key}, ${component.maxScore},
         ${id}, NOW(), NOW())
      `;
    }

    // Insert grading scale
    for (const scale of validatedData.gradingScale) {
      await prisma.$executeRaw`
        INSERT INTO "GradingScale" 
        ("id", "minScore", "maxScore", "grade", "remark", "configurationId", "createdAt", "updatedAt")
        VALUES 
        (gen_random_uuid(), ${scale.minScore}, ${scale.maxScore}, ${scale.grade},
         ${scale.remark}, ${id}, NOW(), NOW())
      `;
    }

    // Get the updated configuration
    const configResult = await prisma.$queryRaw<ConfigResult[]>`
      SELECT 
        rc."id", rc."schoolId", rc."sessionId", 
        rc."cumulativeEnabled", 
        rc."cumulativeMethod",
        rc."showCumulativePerTerm",
        s."name" AS "academicYear" 
      FROM "ResultConfiguration" rc
      JOIN "AcademicSession" s ON rc."sessionId" = s."id"
      WHERE rc."id" = ${id}
    `;

    if (!Array.isArray(configResult) || configResult.length === 0) {
      throw new Error("Failed to retrieve updated configuration");
    }

    // Get periods
    const periodsResult = await prisma.$queryRaw<PeriodResult[]>`
      SELECT rp."id", rp."name", rp."weight" FROM "ResultPeriod" rp WHERE rp."configurationId" = ${id}
    `;

    // Get components
    const componentsResult = await prisma.$queryRaw<ComponentResult[]>`
      SELECT ac."id", ac."name", ac."key", ac."maxScore" FROM "AssessmentComponent" ac 
      WHERE ac."configurationId" = ${id}
    `;

    // Get grading scale
    const gradingScaleResult = await prisma.$queryRaw<GradingScaleResult[]>`
      SELECT gs."id", gs."minScore", gs."maxScore", gs."grade", gs."remark" 
      FROM "GradingScale" gs WHERE gs."configurationId" = ${id}
    `;

    const periods = Array.isArray(periodsResult) ? periodsResult : [];
    const components = Array.isArray(componentsResult) ? componentsResult : [];
    const gradingScale = Array.isArray(gradingScaleResult)
      ? gradingScaleResult
      : [];

    return NextResponse.json({
      ...configResult[0],
      periods,
      assessmentComponents: components,
      gradingScale,
    });
  } catch (error) {
    console.error("Error updating result configuration:", error);
    return NextResponse.json(
      {
        error: "Failed to update result configuration",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
