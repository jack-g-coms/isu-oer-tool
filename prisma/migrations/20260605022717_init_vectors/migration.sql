/*
  Warnings:

  - Changed the type of `embedding` on the `KnowledgeDocumentChunk` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "KnowledgeDocumentChunk" DROP COLUMN "embedding",
ADD COLUMN     "embedding" vector(3) NOT NULL;
