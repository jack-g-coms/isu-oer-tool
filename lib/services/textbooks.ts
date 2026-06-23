import prisma from "../db/prisma";
import { z } from "zod";

import { Textbook, TextbookStatus, Section, SectionStatus, Chapter } from "@/prisma/client";
import TextbookProperties from "../types/TextbookProperties";
import { getRelevantChunks } from "./rag";
import { chat } from "./ai";

import { OUTLINE_PROMPT, OUTLINE_QUERY, OUTLINE_SYSTEM_PROMPT } from "../ai/prompts/TextbookOutline";
import { OutlineResponse } from "../ai/schemas/OutlineResponse";
import { FULL_WRITE_QUERY, FULL_WRITE_SYSTEM_PROMPT, FULL_WRITE_PROMPT } from "../ai/prompts/TextbookFullWrite";
import { SectionContentResponse } from "../ai/schemas/SectionContentResponse";

// Private
async function updateTextbookStatus(textbookId: string, status: TextbookStatus): Promise<Textbook> {
    return await prisma.textbook.update({
        where: {
            id: textbookId
        },
        data: {
            status: status
        }
    });
}

async function updateSectionStatus(sectionId: string, status: SectionStatus): Promise<Section> {
    return await prisma.section.update({
        where: {
            id: sectionId
        },
        data: {
            status: status
        }
    });
}

function buildPrompt(template: string, fields: Record<string, any>): string {
    let result = template;
    for (const field in fields) {
        result = result.replace(
            `{{${field}}}`,
            String(fields[field])
        )
    }
    return result;
}

// Public
export async function getTextbook(textbookId: string, includeAuthor: boolean=false, includeSources: boolean=false, includeChapters: boolean=false) {
    return await prisma.textbook.findFirstOrThrow({
        where: {
            id: textbookId
        },
        include: {
            author: includeAuthor,
            sources: includeSources,
            chapters: includeChapters
        }
    });
}

export async function getTextbookWithSections(textbookId: string, includeAuthor: boolean=false, includeSources: boolean=false) {
    return await prisma.textbook.findFirstOrThrow({
        where: {
            id: textbookId
        },
        include: {
            author: includeAuthor,
            sources: includeSources,
            chapters: {
                include: {
                    sections: true
                }
            }
        }
    });
}

export async function createTextbook(properties: TextbookProperties): Promise<Textbook> {
    return await prisma.textbook.create({
        data: {
            title: properties.title,
            authorId: properties.authorId,
            description: properties.description,
            sources: {
                connect: properties.sources.map(sourceId => ({
                    id: sourceId
                }))
            }
        }
    });
}

export async function outlineTextbook(textbookId: string): Promise<void> {
    const textbook = await getTextbook(textbookId, false, true, false);
    await updateTextbookStatus(textbookId, TextbookStatus.OUTLINING);

    const sourceIds = textbook.sources.map(source => source.id);
    const chunks = await getRelevantChunks(sourceIds, OUTLINE_QUERY);
    
    const prompt = buildPrompt(OUTLINE_PROMPT, {
        "chunks": chunks.map(c => c.text).join("\n\n")
    });
    console.log(prompt);
    const response = await chat(OUTLINE_SYSTEM_PROMPT, prompt, z.toJSONSchema(OutlineResponse));
    const formattedResponse = OutlineResponse.parse(JSON.parse(response));

    for (const chapter of formattedResponse.chapters) {
        const dataChapter = await prisma.chapter.create({
            data: {
                textbookId,
                title: chapter.title,
                summary: chapter.summary,
                order: chapter.order
            }
        });

        await prisma.section.createMany({
            data: chapter.sections.map((section) => ({
                chapterId: dataChapter.id,
                title: section.title,
                summary: section.summary,
                order: section.order
            }))
        });
    }
    await updateTextbookStatus(textbookId, TextbookStatus.READY);
}

export async function writeFullTextbook(textbookId: string): Promise<void> {
    const textbook = await getTextbookWithSections(textbookId, false, true);
    if (textbook.status != TextbookStatus.READY) {
        throw new Error("Textbook must be outlined before it can be written.");
    }

    const sourceIds = textbook.sources.map(source => source.id);
    for (const chapter of textbook.chapters) {
        for (const section of chapter.sections) {
            writeSection(textbook, chapter, section.id, sourceIds); // TOMORROW: ADD TO QUEUE INSTEAD
        }
    }
}

export async function getSection(sectionId: string): Promise<Section> {
    return await prisma.section.findFirstOrThrow({
        where: {
            id: sectionId
        }
    });
}

export async function writeSection(textbook: Textbook, chapter: Chapter, sectionId: string, sources: string[]): Promise<void> {
    const section = await getSection(sectionId);
    if (section.status != SectionStatus.QUEUED) {
        throw new Error("Section must be queued before it can be written.");
    }

    await updateSectionStatus(sectionId, SectionStatus.WRITING);

    const query = buildPrompt(FULL_WRITE_QUERY, {
        "topic": textbook.title,
        "chapter": chapter.title,
        "chapterSummary": chapter.summary,
        "section": section.title,
        "sectionSummary": section.summary
    });
    const chunks = await getRelevantChunks(sources, query, 5);
    const prompt = buildPrompt(FULL_WRITE_PROMPT, {
        "textbookTitle": textbook.title,
        "chapterTitle": chapter.title,
        "sectionTitle": section.title,
        "sectionSummary": section.summary,
        "chunks": chunks.map(c => c.text).join("\n\n")
    });
    console.log(prompt);

    const response = await chat(FULL_WRITE_SYSTEM_PROMPT, prompt, z.toJSONSchema(SectionContentResponse));
    const formattedResponse = SectionContentResponse.parse(JSON.parse(response));

    console.log(JSON.stringify(formattedResponse, null, 2));

}

export async function markOutlineFailure(textbookId: string): Promise<void> {
    await prisma.textbook.update({
        where: {
            id: textbookId 
        },
        data: {
            status: TextbookStatus.FAILED_OUTLINING
        }
    });

    await prisma.chapter.deleteMany({
        where: {
            textbookId: textbookId
        }
    });
}