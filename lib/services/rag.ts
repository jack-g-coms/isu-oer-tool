import { KnowledgeDocumentType, KnowledgeDocument, KnowledgeDocumentChunk, KnowledgeDocumentStatus } from "@/prisma/client";
import KnowledgeDocumentProperties from "@/shared/types/KnowledgeDocumentProperties";
import prisma from "@/lib/db/prisma";
import { generateChunkEmbedding } from "./ai";
import { uploadFile } from "./uploads";

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNK_SIZE = 1500; // 500 characters
const CHUNK_OVERLAP = 200; // 200 characters

// Private
function getKnowledgeDocumentType(file: File): KnowledgeDocumentType {
    switch (file.type) {
        case "application/pdf":
            return KnowledgeDocumentType.PDF;
        case "text/plain":
            return KnowledgeDocumentType.TEXT;
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return KnowledgeDocumentType.DOCX;
        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            return KnowledgeDocumentType.PPTX;
        default:
            throw new Error(`Unsupported file type: ${file.type}`);
    }
}

async function getText(document: KnowledgeDocument, file: File): Promise<string> {
    if (document.type == KnowledgeDocumentType.TEXT) {
        return await file.text();
    } else {
        throw new Error(`Unsupported document type for text extraction: ${document.type}`);
    }
}

async function chunkText(text: string, document: KnowledgeDocument): Promise<KnowledgeDocumentChunk[]> {
    await prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
            status: KnowledgeDocumentStatus.PROCESSING
        }
    });

    const chunks: KnowledgeDocumentChunk[] = [];
    const cleaned = text
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .trim();

    for (let i = 0; i < cleaned.length; i += CHUNK_SIZE) {
        const start = Math.max(0, i - CHUNK_OVERLAP);
        const end = Math.min(cleaned.length, i + CHUNK_SIZE);

        const chunkContent = cleaned.slice(start, end).trim();
        const chunk = await prisma.knowledgeDocumentChunk.create({
            data: {
                documentId: document.id,
                index: i / CHUNK_SIZE,
                text: chunkContent,
                embedding: await generateChunkEmbedding(chunkContent)
            }
        });

        chunks.push(chunk);
    }

    await prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
            status: KnowledgeDocumentStatus.READY
        }
    });

    return chunks;
}

// Public
export async function createKnowledgeDocument(file: File, properties: KnowledgeDocumentProperties): Promise<KnowledgeDocument> {
    let knowledgeDocType = getKnowledgeDocumentType(file);

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE} bytes`);
    }

    const filePath = await uploadFile(file);
    const knowledgeDoc = await prisma.knowledgeDocument.create({
        data: {
            title: properties.title,
            authorId: properties.authorId,
            type: knowledgeDocType,
            uri: filePath,
            aiUsable: properties.aiUsable
        }
    });

    return knowledgeDoc;
}

export async function insertToKnowledgeBase(knowledgeDoc: KnowledgeDocument, file: File): Promise<KnowledgeDocument> {
    const rawTxt = await getText(knowledgeDoc, file);
    await chunkText(rawTxt, knowledgeDoc);

    return knowledgeDoc;
}