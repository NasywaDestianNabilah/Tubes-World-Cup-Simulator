-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_teamAId_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_teamBId_fkey";

-- AlterTable
ALTER TABLE "matches" ALTER COLUMN "teamAId" DROP NOT NULL,
ALTER COLUMN "teamBId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
