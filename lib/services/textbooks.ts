import prisma from "../db/prisma";
import { z } from "zod";

import { Textbook, TextbookStatus, Section, SectionStatus, Chapter } from "@/prisma/client";
import TextbookProperties from "../types/TextbookProperties";
import { getRelevantChunks } from "./rag";
import { chat } from "./ai";
import { sectionQueue } from "../queues/section";

import { OUTLINE_PROMPT, OUTLINE_QUERY, OUTLINE_SYSTEM_PROMPT } from "../ai/prompts/TextbookOutline";
import { OutlineResponse } from "../ai/schemas/OutlineResponse";
import { FULL_WRITE_QUERY, FULL_WRITE_SYSTEM_PROMPT, FULL_WRITE_PROMPT } from "../ai/prompts/TextbookFullWrite";
import { SectionContentResponse } from "../ai/schemas/SectionContentResponse";
import TextbookUpdateProperties from "../types/TextbookUpdateProperties";
import { TextbookWhereInput } from "@/prisma/models";
import { SectionUpdateProperties, SectionContentUpdateProperties } from "../types/SectionUpdateProperties";

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
                    sections: {
                        orderBy: {
                            order: "asc"
                        }
                    }
                },
                orderBy: {
                    order: "asc"
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
            class: properties.class,
            sources: {
                connect: properties.sources.map(sourceId => ({
                    id: sourceId
                }))
            }
        }
    });
}

export async function getUserTextbooks(
    authorId: string,
    includeSources: boolean=true,
    search?: string,
    status?: TextbookStatus,
    page: number=1,
    limit: number=16
) {
    const where: TextbookWhereInput = {
        authorId,
        ...(status && {
            status: status
        }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { class: { contains: search, mode: "insensitive" } }
            ]
        })
    };

    const [textbooks, total] = await prisma.$transaction([
        prisma.textbook.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                sources: includeSources,
                chapters: {
                    include: {
                        sections: true
                    }
                }
            },
            orderBy: {
                updatedAt: "desc"
            }
        }),

        prisma.textbook.count({
            where
        })
    ]);

    return {
        data: textbooks.sort((a, b) => {
            if (a.status == TextbookStatus.FAILED_OUTLINING && b.status != TextbookStatus.FAILED_OUTLINING) return -1;
            if (a.status != TextbookStatus.FAILED_OUTLINING && b.status == TextbookStatus.FAILED_OUTLINING) return 1;
            return 0;
        }),
        total
    };
}

export async function requeueSection(sectionId: string): Promise<Section> {
    return await prisma.section.update({
        where: { id: sectionId },
        data: {
            status: SectionStatus.QUEUED
        }
    });
}

export async function requeueTextbook(textbookId: string): Promise<Textbook> {
    return await prisma.textbook.update({
        where: { id: textbookId },
        data: {
            status: TextbookStatus.QUEUED
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

    for (const chapter of textbook.chapters) {
        for (const section of chapter.sections) {
            await sectionQueue.add("write-section", {
                sectionId: section.id
            });
        }
    }
}

export async function getSection(sectionId: string) {
    return await prisma.section.findFirstOrThrow({
        where: {
            id: sectionId
        },
        include: {
            chapter: {
                include: {
                    textbook: {
                        include: {
                            sources: true
                        }
                    }
                }
            }
        }
    });
}

export async function writeSection(sectionId: string): Promise<void> {
    const section = await getSection(sectionId);

    await updateSectionStatus(sectionId, SectionStatus.WRITING);
    const sourceIds = section.chapter.textbook.sources.map(source => source.id);

    const query = buildPrompt(FULL_WRITE_QUERY, {
        "topic": section.chapter.textbook.title,
        "chapter": section.chapter.title,
        "chapterSummary": section.chapter.summary,
        "section": section.title,
        "sectionSummary": section.summary
    });
    const chunks = await getRelevantChunks(sourceIds, query, 5);
    const prompt = buildPrompt(FULL_WRITE_PROMPT, {
        "textbookTitle": section.chapter.textbook.title,
        "chapterTitle": section.chapter.title,
        "sectionTitle": section.title,
        "sectionSummary": section.summary,
        "chunks": chunks.map(c => c.text).join("\n\n")
    });
    console.log(prompt);

    const response = await chat(FULL_WRITE_SYSTEM_PROMPT, prompt, z.toJSONSchema(SectionContentResponse));
    console.log(response);
    const formattedResponse = SectionContentResponse.parse(JSON.parse(response));

    console.log(JSON.stringify(formattedResponse, null, 2));

    await prisma.section.update({
        where: {
            id: sectionId
        },
        data: {
            content: formattedResponse,
            status: SectionStatus.READY
        }
    });
}

export async function updateTextbook(textbookId: string, properties: TextbookUpdateProperties): Promise<Textbook> {
    return await prisma.textbook.update({
        where: { id: textbookId },
        data: {
            sources: {
                connect: properties.sources.map(sourceId => ({
                    id: sourceId
                }))
            },
            title: properties.title,
            description: properties.description,
            class: properties.class
        }
    });
}

export async function updateSection(sectionId: string, properties: SectionUpdateProperties | SectionContentUpdateProperties): Promise<Section> {
    return await prisma.section.update({
        where: {
            id: sectionId
        },
        data: properties
    });
}

export async function getChapter(chapterId: string): Promise<Chapter> {
    return await prisma.chapter.findFirstOrThrow({
        where: {
            id: chapterId
        }
    });
}

export async function deleteSection(sectionId: string) {
    return await prisma.section.delete({
        where: {
            id: sectionId
        }
    });
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

export async function markSectionFailure(sectionId: string, failureType: SectionStatus): Promise<void> {
    await prisma.section.update({
        where: {
            id: sectionId 
        },
        data: {
            status: failureType
        }
    });
}

export async function deleteTextbook(textbookId: string): Promise<void> {
    await prisma.textbook.delete({
        where: {
            id: textbookId
        }
    });
}

export async function hasTextbookAccess(textbookId: string, userId: string): Promise<boolean> {
    const textbook = await getTextbook(textbookId, false, false, false);
    return textbook.authorId == userId;
}