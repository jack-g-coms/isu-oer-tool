/*
  Warnings:

  - The values [PENDING] on the enum `KnowledgeDocumentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "KnowledgeDocumentStatus_new" AS ENUM ('QUEUED', 'PROCESSING', 'READY', 'FAILED');
ALTER TABLE "public"."KnowledgeDocument" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "KnowledgeDocument" ALTER COLUMN "status" TYPE "KnowledgeDocumentStatus_new" USING ("status"::text::"KnowledgeDocumentStatus_new");
ALTER TYPE "KnowledgeDocumentStatus" RENAME TO "KnowledgeDocumentStatus_old";
ALTER TYPE "KnowledgeDocumentStatus_new" RENAME TO "KnowledgeDocumentStatus";
DROP TYPE "public"."KnowledgeDocumentStatus_old";
ALTER TABLE "KnowledgeDocument" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
COMMIT;

-- AlterTable
ALTER TABLE "KnowledgeDocument" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
