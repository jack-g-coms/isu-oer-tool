import { apiUrl } from "@/lib/constants/urls";

export async function createKnowledgeDocument(data: FormData) {
    const response = await fetch(`${apiUrl}/knowledge`, {
        method: "POST",
        body: data
    });

    const res = await response.json();
    if (!res.ok) {
        throw new Error(res.error);
    } else {
        return res;
    }
}