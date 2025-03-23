-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "attendance" DOUBLE PRECISION,
ADD COLUMN     "behavior" INTEGER,
ADD COLUMN     "classAverage" DOUBLE PRECISION,
ADD COLUMN     "effort" INTEGER,
ADD COLUMN     "position" INTEGER,
ADD COLUMN     "skillRatings" JSONB,
ADD COLUMN     "teacherNote" TEXT;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
