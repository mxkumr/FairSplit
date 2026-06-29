-- CreateEnum
CREATE TYPE "GroupSettlementMode" AS ENUM ('SIMPLIFIED', 'DIRECT');

-- AlterTable
ALTER TABLE "groups" ADD COLUMN "settlement_mode" "GroupSettlementMode" NOT NULL DEFAULT 'SIMPLIFIED';
