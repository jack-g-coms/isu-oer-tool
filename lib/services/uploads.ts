import { promises as fs } from "fs";
import path from "path";

// Public
export async function uploadFile(file: File): Promise<string> {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return filePath;
}