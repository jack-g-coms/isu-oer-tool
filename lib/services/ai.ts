import { Ollama, ChatResponse } from "ollama";

const ollama = new Ollama({
    host: process.env.OLLAMA_HOST ?? "http://localhost:11434"
});

// Public
export async function generateChunkEmbedding(text: string): Promise<number[]> {
    const response = await ollama.embed({
        model: "nomic-embed-text",
        input: text
    });
    return response.embeddings[0];
}

export async function chat(systemPrompt: string, prompt: string, format?: string | object): Promise<ChatResponse> {
    return await ollama.chat({
        model: "qwen2.5",
        messages: [
            {
                role: "system",
                content: systemPrompt 
            },
            {
                role: "user",
                content: prompt
            }
        ],
        format
    });
}