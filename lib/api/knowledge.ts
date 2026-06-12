import { apiUrl } from "@/lib/constants/urls";
import type { KnowledgeDocument } from "@/prisma/client";

export async function createKnowledgeDocument(data: FormData): Promise<{ success: boolean, data: KnowledgeDocument }> {
    const response = await fetch(`${apiUrl}/knowledge`, {
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

export async function retryIngest(knowledgeDocId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${apiUrl}/knowledge/${knowledgeDocId}/reingest`, {
        method: "POST",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export async function updateKnowledgeDocument(knowledgeDocId: string, properties: FormData): Promise<{ success: boolean, data: KnowledgeDocument }> {
    const response = await fetch(`${apiUrl}/knowledge/${knowledgeDocId}/`, {
        method: "PATCH",
        body: properties
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export async function deleteKnowledgeDocument(knowledgeDocId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${apiUrl}/knowledge/${knowledgeDocId}/`, {
        method: "DELETE",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}

export async function getKnowledgeDocumentUrl(knowledgeDocId: string): Promise<{ success: boolean, data: string }> {
    const response = await fetch(`${apiUrl}/knowledge/${knowledgeDocId}/`, {
        method: "GET",
    });

    const res = await response.json();
    if (!response.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}