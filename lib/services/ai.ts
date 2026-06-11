import { Ollama } from "ollama";

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