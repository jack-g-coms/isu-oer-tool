-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('PENDING', 'QUEUED', 'WRITING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "status" "SectionStatus" NOT NULL DEFAULT 'PENDING';
