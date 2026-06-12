-- DropForeignKey
ALTER TABLE "KnowledgeDocument" DROP CONSTRAINT "KnowledgeDocument_authorId_fkey";

-- DropForeignKey
ALTER TABLE "KnowledgeDocumentChunk" DROP CONSTRAINT "KnowledgeDocumentChunk_documentId_fkey";

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentChunk" ADD CONSTRAINT "KnowledgeDocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
