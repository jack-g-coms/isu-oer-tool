import { Image } from "@/prisma/client";

import prisma from "../db/prisma";
import { deleteFile, getUrl, uploadFile } from "./uploads";

// Public
export async function uploadImage(file: File, sectionId: string): Promise<Image> {
    const uploadKey = await uploadFile(file, "section-images");
    
    return prisma.image.create({
        data: {
            uploadKey,
            sectionId
        }
    });
}

export async function getImage(uploadKey: string) {
    return prisma.image.findFirstOrThrow({
        where: {
            uploadKey
        },
        include: {
            section: {
                include: {
                    chapter: true
                }
            }
        }
    });
}

export async function deleteImage(uploadKey: string): Promise<void> {
    await prisma.image.delete({
        where: {
            uploadKey
        }
    });

    await deleteFile(uploadKey, "section-images");
}

export async function getImageUrl(uploadKey: string): Promise<string> {
    return await getUrl(uploadKey, "section-images");
}