/*
  Warnings:

  - The values [PENDING] on the enum `SectionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [WRITING,FAILED_WRITING,OUTLINED] on the enum `TextbookStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SectionStatus_new" AS ENUM ('QUEUED', 'WRITING', 'READY', 'FAILED');
ALTER TABLE "public"."Section" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Section" ALTER COLUMN "status" TYPE "SectionStatus_new" USING ("status"::text::"SectionStatus_new");
ALTER TYPE "SectionStatus" RENAME TO "SectionStatus_old";
ALTER TYPE "SectionStatus_new" RENAME TO "SectionStatus";
DROP TYPE "public"."SectionStatus_old";
ALTER TABLE "Section" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TextbookStatus_new" AS ENUM ('QUEUED', 'OUTLINING', 'READY', 'FAILED_OUTLINING');
ALTER TABLE "public"."Textbook" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Textbook" ALTER COLUMN "status" TYPE "TextbookStatus_new" USING ("status"::text::"TextbookStatus_new");
ALTER TYPE "TextbookStatus" RENAME TO "TextbookStatus_old";
ALTER TYPE "TextbookStatus_new" RENAME TO "TextbookStatus";
DROP TYPE "public"."TextbookStatus_old";
ALTER TABLE "Textbook" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
COMMIT;

-- AlterTable
ALTER TABLE "Section" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
