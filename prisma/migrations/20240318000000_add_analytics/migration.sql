-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActivityLog_userId_idx" ON "UserActivityLog"("userId");

-- CreateIndex
CREATE INDEX "UserActivityLog_page_idx" ON "UserActivityLog"("page");

-- CreateIndex
CREATE INDEX "UserActivityLog_createdAt_idx" ON "UserActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiRequestLog_route_idx" ON "ApiRequestLog"("route");

-- CreateIndex
CREATE INDEX "ApiRequestLog_createdAt_idx" ON "ApiRequestLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 