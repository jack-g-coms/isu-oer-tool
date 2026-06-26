import { apiUrl } from "@/lib/constants/urls";
import type { Textbook } from "@/prisma/client";

export async function createTextbook(data: FormData): Promise<{ success: boolean, data: Textbook }> {
    const response = await fetch(`${apiUrl}/textbooks`, {
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

export async function reOutline(textbookId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${apiUrl}/textbooks/${textbookId}/reoutline`, {
        method: "POST",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export async function updateTextbook(textbookId: string, properties: FormData): Promise<{ success: boolean, data: Textbook }> {
    const response = await fetch(`${apiUrl}/textbooks/${textbookId}`, {
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

export async function deleteTextbook(textbookId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${apiUrl}/textbooks/${textbookId}`, {
        method: "DELETE",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}