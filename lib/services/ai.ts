import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ZodObject } from "zod";
import { MAX_COMPLETION_TOKENS } from "../constants/ai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Public
export async function generateChunkEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text
    });
    return response.data[0].embedding;
}

export async function chat(systemPrompt: string, prompt: string, schema: ZodObject, schemaName: string, model: string="gpt-5-mini"): Promise<Record<string, any>> {
    const completion = await openai.chat.completions.parse({
        model,
        messages: [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        response_format: zodResponseFormat(schema, schemaName)
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
        throw new Error("OpenAI returned no parsed response");
    }
    return parsed;
}