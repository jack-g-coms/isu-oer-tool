import { apiUrl } from "@/lib/constants/urls";

export async function getTextbookDraftUrl(textbookId: string): Promise<{ success: boolean, data: string }> {
    const response = await fetch(`${apiUrl}/textbooks/${textbookId}`, {
        method: "POST",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export async function publishTextbook(textbookId: string): Promise<{ success: boolean, data: string }> {
    const response = await fetch(`${apiUrl}/textbooks/${textbookId}/publish`, {
        method: "POST",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export function getPublishedTextbookUrl(textbookId: string): string {
    return `${apiUrl}/textbooks/${textbookId}/publish`;
}

export async function unpublishTextbook(textbookId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${apiUrl}/textbooks/${textbookId}/publish`, {
        method: "DELETE",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}