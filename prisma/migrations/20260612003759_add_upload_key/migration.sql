/*
  Warnings:

  - You are about to drop the column `uri` on the `KnowledgeDocument` table. All the data in the column will be lost.
  - Added the required column `uploadKey` to the `KnowledgeDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KnowledgeDocument" DROP COLUMN "uri",
ADD COLUMN     "uploadKey" TEXT NOT NULL;
