import ollama from "ollama";

// Public
export async function generateChunkEmbedding(text: string): Promise<number[]> {
    const response = await ollama.embed({
        model: "nomic-embed-text",
        input: text
    });
    return response.embeddings[0];
}