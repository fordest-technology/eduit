/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `attendance` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `behavior` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `classAverage` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `effort` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `examType` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `marks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `skillRatings` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `teacherNote` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarks` on the `Result` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,subjectId,periodId,sessionId]` on the table `Result` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `periodId` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remark` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Made the column `grade` on table `Result` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_approvedBy_fkey";

-- DropIndex
DROP INDEX "Result_studentId_subjectId_sessionId_examType_key";

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
DROP COLUMN "attendance",
DROP COLUMN "behavior",
DROP COLUMN "classAverage",
DROP COLUMN "effort",
DROP COLUMN "examType",
DROP COLUMN "isApproved",
DROP COLUMN "marks",
DROP COLUMN "position",
DROP COLUMN "remarks",
DROP COLUMN "skillRatings",
DROP COLUMN "teacherNote",
DROP COLUMN "totalMarks",
ADD COLUMN     "adminComment" TEXT,
ADD COLUMN     "affectiveTraits" JSONB,
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "cumulativeAverage" DOUBLE PRECISION,
ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "periodId" TEXT NOT NULL,
ADD COLUMN     "psychomotorSkills" JSONB,
ADD COLUMN     "remark" TEXT NOT NULL,
ADD COLUMN     "teacherComment" TEXT,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "grade" SET NOT NULL;

-- CreateTable
CREATE TABLE "ResultConfiguration" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "cumulativeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cumulativeMethod" TEXT NOT NULL DEFAULT 'progressive_average',
    "showCumulativePerTerm" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "configurationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "configurationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingScale" (
    "id" TEXT NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentScore" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "componentId" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponentScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Result_studentId_subjectId_periodId_sessionId_key" ON "Result"("studentId", "subjectId", "periodId", "sessionId");

-- CreateIndex
CREATE INDEX "School_subdomain_idx" ON "School"("subdomain");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ResultPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultConfiguration" ADD CONSTRAINT "ResultConfiguration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultPeriod" ADD CONSTRAINT "ResultPeriod_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "ResultConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentComponent" ADD CONSTRAINT "AssessmentComponent_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "ResultConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingScale" ADD CONSTRAINT "GradingScale_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "ResultConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentScore" ADD CONSTRAINT "ComponentScore_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "AssessmentComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentScore" ADD CONSTRAINT "ComponentScore_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
