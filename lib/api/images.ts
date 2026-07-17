import { apiUrl } from "../constants/urls";

export async function uploadImage(sectionId: string, data: FormData): Promise<{ success: boolean, data: string }> {
    const response = await fetch(`${apiUrl}/sections/${sectionId}/images`, {
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