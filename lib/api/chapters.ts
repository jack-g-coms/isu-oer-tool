import { apiUrl } from "@/lib/constants/urls";
import type { Chapter } from "@/prisma/client";

export async function createChapter(textbookId: string, data: FormData): Promise<{ success: boolean, data: Chapter }> {
    const response = await fetch(`${apiUrl}/textbooks/${textbookId}/chapters`, {
        method: "POST",
        body: data
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}