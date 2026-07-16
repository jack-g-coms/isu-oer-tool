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

export async function updateChapter(chapterId: string, properties: FormData): Promise<{ success: boolean, data: Chapter }> {
    const response = await fetch(`${apiUrl}/chapters/${chapterId}`, {
        method: "PUT",
        body: properties
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export async function moveChapter(chapterId: string, data: { targetChapterId?: string, position: "before" | "after" }): Promise<{ success: boolean }> {
    const response = await fetch(`${apiUrl}/chapters/${chapterId}/move`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export async function deleteChapter(chapterId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${apiUrl}/chapters/${chapterId}`, {
        method: "DELETE",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}