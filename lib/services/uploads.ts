import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../utils/s3";

// Public
export async function uploadFile(file: File, bucket: string="knowledge-documents", uploadKey?: string): Promise<string> {
    const key = uploadKey ?? `${crypto.randomUUID()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: file.type
        })
    );

    return key;
}

export async function getUrl(uploadKey: string, bucket: string="knowledge-documents"): Promise<string> {
    return await getSignedUrl(
        s3,
        new GetObjectCommand({
            Bucket: bucket,
            Key: uploadKey
        }),
        { expiresIn: 60 * 10 }
    );
}

export async function getFile(uploadKey: string, bucket: string="knowledge-documents"): Promise<Buffer> {
    const res = await s3.send(
        new GetObjectCommand({
            Bucket: bucket,
            Key: uploadKey
        })
    );

    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
}

export async function deleteFile(uploadKey: string, bucket: string="knowledge-documents"): Promise<void> {
    await s3.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: uploadKey
        })
    );
}