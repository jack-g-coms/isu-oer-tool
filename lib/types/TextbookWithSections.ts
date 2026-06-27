import { Prisma } from "@/prisma/client";

type TextbookWithSections = Prisma.TextbookGetPayload<{
    include: {
        chapters: {
            include: {
                sections: true;
            }
        }
    }
}>;

export default TextbookWithSections;