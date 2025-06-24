-- CreateTable
CREATE TABLE "OnlineAgent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentUsername" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnlineAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfflineMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OnlineAgent" ADD CONSTRAINT "OnlineAgent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflineMessage" ADD CONSTRAINT "OfflineMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
