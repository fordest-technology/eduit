import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Helper functions
const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });
const notFound = () =>
  NextResponse.json({ error: "Not found" }, { status: 404 });
const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

// Define allowed roles
const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

// Type guard for allowed roles
function isAllowedRole(role: string): role is AllowedRole {
  return ALLOWED_ROLES.includes(role as AllowedRole);
}

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
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const { schoolId } = await params;
  try {
    const { schoolId } = await params;
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
        schoolId: schoolId,
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
      (gen_random_uuid(), ${schoolId}, ${academicSession.id}, 
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
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const { schoolId } = await params;
  try {
    const { schoolId } = await params;
    // Authentication
    const session = await getSession();
    if (!session) return unauthorized();

    // Authorization
    if (!isAllowedRole(session.role)) return forbidden();

    // School context validation
    if (!session.schoolId) return badRequest("School context required");

    // Verify school context matches route param for non-super admins
    if (
      session.role !== UserRole.SUPER_ADMIN &&
      session.schoolId !== schoolId
    ) {
      return forbidden();
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
      WHERE rc."schoolId" = ${schoolId}
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

    // 3. Return filtered or full results
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const config = results.find((r) => r.sessionId === sessionId);
      return NextResponse.json(config || { periods: [], assessmentComponents: [], gradingScale: [] });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[GET] /schools/[schoolId]/results/config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const { schoolId } = await params;
  try {
    const { schoolId } = await params;
    // Authentication
    const session = await getSession();
    if (!session) return unauthorized();

    // Authorization
    if (!isAllowedRole(session.role)) return forbidden();

    // School context validation
    if (!session.schoolId) return badRequest("School context required");

    // Verify school context matches route param for non-super admins
    if (
      session.role !== UserRole.SUPER_ADMIN &&
      session.schoolId !== schoolId
    ) {
      return forbidden();
    }

    const body = await request.json();
    const { id, ...data } = body;

    // Validate input
    const validationResult = configurationSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify resource ownership
    const existing = await prisma.resultConfiguration.findFirst({
      where: {
        id,
        schoolId: schoolId,
      },
    });

    if (!existing) return notFound();

    // Get session ID from academic year name
    const academicSession = await prisma.academicSession.findFirst({
      where: {
        name: validatedData.academicYear,
        schoolId: session.schoolId,
      },
      select: { id: true },
    });

    if (!academicSession) return badRequest("Academic session not found");

    // Use transaction for related operations
    const result = await prisma.$transaction(async (tx) => {
      // Update configuration
      await tx.$executeRaw`
        UPDATE "ResultConfiguration"
        SET 
          "cumulativeEnabled" = ${validatedData.cumulativeEnabled},
          "cumulativeMethod" = ${validatedData.cumulativeMethod},
          "showCumulativePerTerm" = ${validatedData.showCumulativePerTerm},
          "updatedAt" = NOW()
        WHERE "id" = ${id} AND "schoolId" = ${session.schoolId}
      `;

      // Delete existing related records
      await tx.$executeRaw`DELETE FROM "ResultPeriod" WHERE "configurationId" = ${id}`;
      await tx.$executeRaw`DELETE FROM "AssessmentComponent" WHERE "configurationId" = ${id}`;
      await tx.$executeRaw`DELETE FROM "GradingScale" WHERE "configurationId" = ${id}`;

      // Insert periods
      for (const period of validatedData.periods) {
        await tx.$executeRaw`
          INSERT INTO "ResultPeriod" 
          ("id", "name", "weight", "configurationId", "createdAt", "updatedAt")
          VALUES 
          (gen_random_uuid(), ${period.name}, ${period.weight}, ${id}, NOW(), NOW())
        `;
      }

      // Insert assessment components
      for (const component of validatedData.assessmentComponents) {
        await tx.$executeRaw`
          INSERT INTO "AssessmentComponent" 
          ("id", "name", "key", "maxScore", "configurationId", "createdAt", "updatedAt")
          VALUES 
          (gen_random_uuid(), ${component.name}, ${component.key}, ${component.maxScore},
           ${id}, NOW(), NOW())
        `;
      }

      // Insert grading scale
      for (const scale of validatedData.gradingScale) {
        await tx.$executeRaw`
          INSERT INTO "GradingScale" 
          ("id", "minScore", "maxScore", "grade", "remark", "configurationId", "createdAt", "updatedAt")
          VALUES 
          (gen_random_uuid(), ${scale.minScore}, ${scale.maxScore}, ${scale.grade},
           ${scale.remark}, ${id}, NOW(), NOW())
        `;
      }

      // Get updated configuration with all related data
      const configResult = await tx.$queryRaw<ConfigResult[]>`
        SELECT 
          rc."id", rc."schoolId", rc."sessionId", 
          rc."cumulativeEnabled", 
          rc."cumulativeMethod",
          rc."showCumulativePerTerm",
          s."name" AS "academicYear" 
        FROM "ResultConfiguration" rc
        JOIN "AcademicSession" s ON rc."sessionId" = s."id"
        WHERE rc."id" = ${id} AND rc."schoolId" = ${session.schoolId}
      `;

      const periodsResult = await tx.$queryRaw<PeriodResult[]>`
        SELECT rp."id", rp."name", rp."weight" 
        FROM "ResultPeriod" rp 
        WHERE rp."configurationId" = ${id}
      `;

      const componentsResult = await tx.$queryRaw<ComponentResult[]>`
        SELECT ac."id", ac."name", ac."key", ac."maxScore" 
        FROM "AssessmentComponent" ac 
        WHERE ac."configurationId" = ${id}
      `;

      const gradingScaleResult = await tx.$queryRaw<GradingScaleResult[]>`
        SELECT gs."id", gs."minScore", gs."maxScore", gs."grade", gs."remark" 
        FROM "GradingScale" gs 
        WHERE gs."configurationId" = ${id}
      `;

      return {
        ...configResult[0],
        periods: periodsResult,
        assessmentComponents: componentsResult,
        gradingScale: gradingScaleResult,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PUT] /schools/[schoolId]/results/config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
