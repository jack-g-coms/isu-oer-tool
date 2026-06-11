import { promises as fs } from "fs";
import path from "path";

// Public
export async function uploadFile(file: File): Promise<string> {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return `http://host.docker.internal:3000/uploads/${fileName}`;
}

export async function getFile(uri: string): Promise<Buffer> {
    const res = await fetch(uri);

    if (!res.ok) {
        throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}