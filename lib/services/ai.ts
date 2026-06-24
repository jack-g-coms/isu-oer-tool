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

export async function chat(systemPrompt: string, prompt: string, format?: string | object): Promise<string> {
    const stream = await ollama.chat({
        model: "qwen2.5:7b",
        keep_alive: "30m",
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
        stream: true,
        format,
        options: {
            temperature: 0.2,
            top_p: 0.9,
            num_ctx: 8192,
            num_predict: 1500
        }
    });

    let result = "";
    for await (const chunk of stream) {
        result += chunk.message.content;
    }
    return result.trim();
}