import prisma from "../db/prisma";
import { z } from "zod";

import { Textbook, TextbookStatus } from "@/prisma/client";
import TextbookProperties from "../types/TextbookProperties";
import { getRelevantChunks } from "./rag";
import { chat } from "./ai";

import { OUTLINE_PROMPT, OUTLINE_QUERY, OUTLINE_SYSTEM_PROMPT } from "../ai/prompts/TextbookOutline";
import { OutlineResponse } from "../ai/schemas/OutlineResponse";

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

export async function outlineTextbook(textbookId: string) {
    const textbook = await getTextbook(textbookId, false, true, false);
    await updateTextbookStatus(textbookId, TextbookStatus.OUTLINING);

    const sourceIds = textbook.sources.map(source => source.id);
    const chunks = await getRelevantChunks(sourceIds, OUTLINE_QUERY);
    
    const prompt = OUTLINE_PROMPT.replace(
        "{{chunks}}",
        chunks.map(c => c.text).join("\n\n")
    )
    console.log(prompt);
    const response = await chat(OUTLINE_SYSTEM_PROMPT, prompt, z.toJSONSchema(OutlineResponse));
    const formattedResponse = OutlineResponse.parse(JSON.parse(response.message.content));
    console.log(JSON.stringify(formattedResponse, null, 2))
}