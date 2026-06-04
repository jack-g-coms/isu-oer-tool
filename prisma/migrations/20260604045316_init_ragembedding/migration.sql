/*
  Warnings:

  - You are about to drop the column `tokenCount` on the `KnowledgeDocumentChunk` table. All the data in the column will be lost.
  - The `embedding` column on the `KnowledgeDocumentChunk` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "KnowledgeDocumentChunk" DROP COLUMN "tokenCount",
DROP COLUMN "embedding",
ADD COLUMN     "embedding" DOUBLE PRECISION[];
