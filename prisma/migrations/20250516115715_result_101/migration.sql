/*
  Warnings:

  - You are about to drop the column `academicYear` on the `ResultConfiguration` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schoolId,sessionId]` on the table `ResultConfiguration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `ResultConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResultConfiguration" DROP COLUMN "academicYear",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ResultConfiguration_schoolId_sessionId_key" ON "ResultConfiguration"("schoolId", "sessionId");

-- AddForeignKey
ALTER TABLE "ResultConfiguration" ADD CONSTRAINT "ResultConfiguration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
