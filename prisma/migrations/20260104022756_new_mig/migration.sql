/*
  Warnings:

  - A unique constraint covering the columns `[squadWalletId]` on the table `School` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SquadPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedById" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankCode" TEXT,
ADD COLUMN     "billingStatus" "BillingStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "lastOnboardingActivity" TIMESTAMP(3),
ADD COLUMN     "paidStudentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "squadWalletId" TEXT;

-- CreateTable
CREATE TABLE "ResultPublication" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "classId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedById" TEXT NOT NULL,
    "totalStudents" INTEGER NOT NULL,
    "notificationsSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolWallet" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquadPayment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeId" TEXT,
    "squadReference" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "platformFee" DECIMAL(20,2) NOT NULL,
    "netAmount" DECIMAL(20,2) NOT NULL,
    "status" "SquadPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "SquadPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsagePayment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "studentCount" INTEGER NOT NULL,
    "status" "SquadPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "squadReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "UsagePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolWallet_schoolId_key" ON "SchoolWallet"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadPayment_squadReference_key" ON "SquadPayment"("squadReference");

-- CreateIndex
CREATE INDEX "SquadPayment_schoolId_idx" ON "SquadPayment"("schoolId");

-- CreateIndex
CREATE INDEX "SquadPayment_squadReference_idx" ON "SquadPayment"("squadReference");

-- CreateIndex
CREATE UNIQUE INDEX "UsagePayment_squadReference_key" ON "UsagePayment"("squadReference");

-- CreateIndex
CREATE INDEX "UsagePayment_schoolId_idx" ON "UsagePayment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "School_squadWalletId_key" ON "School"("squadWalletId");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultPublication" ADD CONSTRAINT "ResultPublication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultPublication" ADD CONSTRAINT "ResultPublication_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultPublication" ADD CONSTRAINT "ResultPublication_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ResultPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultPublication" ADD CONSTRAINT "ResultPublication_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolWallet" ADD CONSTRAINT "SchoolWallet_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadPayment" ADD CONSTRAINT "SquadPayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadPayment" ADD CONSTRAINT "SquadPayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsagePayment" ADD CONSTRAINT "UsagePayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
