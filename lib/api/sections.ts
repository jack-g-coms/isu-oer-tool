import { apiUrl } from "@/lib/constants/urls";
import type { Section } from "@/prisma/client";

export async function saveContent(sectionId: string, content: Object): Promise<{ success: boolean, data: Section }> {
    const response = await fetch(`${apiUrl}/sections/${sectionId}/save-content`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export async function updateSection(sectionId: string, properties: FormData): Promise<{ success: boolean, data: Section }> {
    const response = await fetch(`${apiUrl}/sections/${sectionId}`, {
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

export async function deleteSection(sectionId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${apiUrl}/sections/${sectionId}`, {
        method: "DELETE",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export async function rewrite(sectionId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${apiUrl}/sections/${sectionId}/rewrite`, {
        method: "POST",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}