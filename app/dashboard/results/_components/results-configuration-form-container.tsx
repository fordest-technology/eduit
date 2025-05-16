import { prisma, withErrorHandling } from "@/lib/prisma";
import { ResultsConfigurationForm } from "./results-configuration-form";
import { ResultConfiguration } from "../types";

// Define interfaces based on DB schema
interface ResultPeriodType {
    id: string;
    name: string;
    weight: number;
}

interface AssessmentComponentType {
    id: string;
    name: string;
    key: string;
    maxScore: number;
}

interface GradingScaleType {
    id: string;
    minScore: number;
    maxScore: number;
    grade: string;
    remark: string;
}

interface ResultsConfigurationFormContainerProps {
    schoolId: string;
}

export async function ResultsConfigurationFormContainer({
    schoolId,
}: ResultsConfigurationFormContainerProps) {
    try {
        return await withErrorHandling(async () => {
            // First get the current academic session
            const currentSession = await prisma.academicSession.findFirst({
                where: {
                    schoolId,
                    isCurrent: true
                },
                select: {
                    id: true,
                    name: true
                }
            });

            if (!currentSession) {
                return (
                    <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200">
                        <p className="text-yellow-800">
                            No active academic session found. Please set an active academic session in the Academic Sessions page.
                        </p>
                    </div>
                );
            }

            // Get existing configuration using SQL
            const existingConfigQuery = await prisma.$queryRaw`
                SELECT 
                    rc."id", rc."schoolId", rc."sessionId", 
                    rc."cumulativeEnabled", 
                    rc."cumulativeMethod",
                    rc."showCumulativePerTerm",
                    s."name" AS "academicYear"
                FROM "ResultConfiguration" rc
                JOIN "AcademicSession" s ON rc."sessionId" = s."id"
                WHERE rc."schoolId" = ${schoolId}
                AND rc."sessionId" = ${currentSession.id}
                ORDER BY rc."createdAt" DESC
                LIMIT 1
            `;

            // Convert query result to array if it's not already
            const existingConfig = Array.isArray(existingConfigQuery) ? existingConfigQuery : [];

            // If configuration exists, format and return it
            if (existingConfig.length > 0) {
                const config = existingConfig[0];

                // Fetch related data
                const periodsQuery = await prisma.$queryRaw`
                    SELECT rp."id", rp."name", rp."weight" FROM "ResultPeriod" rp
                    WHERE rp."configurationId" = ${config.id}
                `;

                const componentsQuery = await prisma.$queryRaw`
                    SELECT ac."id", ac."name", ac."key", ac."maxScore" FROM "AssessmentComponent" ac
                    WHERE ac."configurationId" = ${config.id}
                `;

                const scalesQuery = await prisma.$queryRaw`
                    SELECT gs."id", gs."minScore", gs."maxScore", gs."grade", gs."remark" FROM "GradingScale" gs
                    WHERE gs."configurationId" = ${config.id}
                `;

                // Convert query results to arrays if they're not already
                const periods = Array.isArray(periodsQuery) ? periodsQuery : [];
                const components = Array.isArray(componentsQuery) ? componentsQuery : [];
                const scales = Array.isArray(scalesQuery) ? scalesQuery : [];

                const formattedConfig: ResultConfiguration = {
                    id: config.id,
                    schoolId: config.schoolId,
                    academicYear: config.academicYear,
                    periods: periods.map((p: ResultPeriodType) => ({
                        id: p.id,
                        name: p.name,
                        weight: Number(p.weight)
                    })),
                    assessmentComponents: components.map((ac: AssessmentComponentType) => ({
                        id: ac.id,
                        name: ac.name,
                        key: ac.key,
                        maxScore: Number(ac.maxScore)
                    })),
                    gradingScale: scales.map((gs: GradingScaleType) => ({
                        id: gs.id,
                        minScore: Number(gs.minScore),
                        maxScore: Number(gs.maxScore),
                        grade: gs.grade,
                        remark: gs.remark
                    })),
                    cumulativeEnabled: Boolean(config.cumulativeEnabled),
                    cumulativeMethod: config.cumulativeMethod,
                    showCumulativePerTerm: Boolean(config.showCumulativePerTerm)
                };

                return <ResultsConfigurationForm initialData={formattedConfig} />;
            }

            // If no configuration exists, create a new one
            await prisma.$executeRaw`
                INSERT INTO "ResultConfiguration" 
                ("id", "schoolId", "sessionId", "cumulativeEnabled", "cumulativeMethod", "showCumulativePerTerm", "createdAt", "updatedAt")
                VALUES 
                (gen_random_uuid(), ${schoolId}, ${currentSession.id}, true, 'progressive_average', true, NOW(), NOW())
            `;

            // Get the newly created config
            const newlyCreatedConfigQuery = await prisma.$queryRaw`
                SELECT 
                    rc."id", rc."schoolId", 
                    s."name" AS "academicYear"
                FROM "ResultConfiguration" rc
                JOIN "AcademicSession" s ON rc."sessionId" = s."id"
                WHERE rc."schoolId" = ${schoolId}
                AND rc."sessionId" = ${currentSession.id}
                ORDER BY rc."createdAt" DESC
                LIMIT 1
            `;

            // Convert query result to array
            const newlyCreatedConfig = Array.isArray(newlyCreatedConfigQuery) ? newlyCreatedConfigQuery : [];

            if (newlyCreatedConfig.length === 0) {
                throw new Error("Failed to create new configuration");
            }

            const config = newlyCreatedConfig[0];

            // Return empty configuration with the current session
            const formattedConfig: ResultConfiguration = {
                id: config.id,
                schoolId,
                academicYear: currentSession.name,
                periods: [],
                assessmentComponents: [],
                gradingScale: [],
                cumulativeEnabled: true,
                cumulativeMethod: "progressive_average",
                showCumulativePerTerm: true
            };

            return <ResultsConfigurationForm initialData={formattedConfig} />;
        });
    } catch (error) {
        console.error("Error fetching result configuration:", error);
        return (
            <div className="p-4 rounded-md bg-red-50 border border-red-200">
                <p className="text-red-800">
                    An error occurred while loading the result configuration. Please try again.
                </p>
                <p className="text-sm text-red-600 mt-2">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
            </div>
        );
    }
}