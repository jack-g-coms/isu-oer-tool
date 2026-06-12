import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../utils/s3";

// Public
export async function uploadFile(file: File): Promise<string> {
    const key = `${crypto.randomUUID()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await s3.send(
        new PutObjectCommand({
            Bucket: "knowledge-documents",
            Key: key,
            Body: buffer,
            ContentType: file.type
        })
    );

    return key;
}

export async function getUrl(uploadKey: string): Promise<string> {
    return await getSignedUrl(
        s3,
        new GetObjectCommand({
            Bucket: "knowledge-documents",
            Key: uploadKey
        }),
        { expiresIn: 60 * 10 }
    );
}

export async function getFile(uploadKey: string): Promise<Buffer> {
    const res = await s3.send(
        new GetObjectCommand({
            Bucket: "knowledge-documents",
            Key: uploadKey
        })
    );

    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
}

export async function deleteFile(uploadKey: string): Promise<void> {
    await s3.send(
        new DeleteObjectCommand({
            Bucket: "knowledge-documents",
            Key: uploadKey
        })
    );
}