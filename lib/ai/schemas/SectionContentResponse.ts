import { z } from "zod";

const MarkSchema = z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.any()).optional()
});

const TextNodeSchema = z.object({
    type: z.literal("text"),
    text: z.string(),
    marks: z.array(MarkSchema).optional()
});

const ParagraphSchema = z.object({
    type: z.literal("paragraph"),
    content: z.array(TextNodeSchema).optional()
});

const HeadingSchema = z.object({
    type: z.literal("heading"),
    attrs: z.object({
        level: z.number().min(1).max(6)
    }).optional(),
    content: z.array(TextNodeSchema).optional()
});

const ListItemSchema = z.object({
    type: z.literal("listItem"),
    content: z.array(
        z.object({
            type: z.literal("paragraph"),
            content: z.array(TextNodeSchema).optional()
        })
    )
});

const BulletListSchema = z.object({
    type: z.literal("bulletList"),
    content: z.array(ListItemSchema)
});

export const SectionContentResponse = z.object({
    type: z.literal("doc"),
    content: z.array(
        z.union([
            ParagraphSchema,
            HeadingSchema,
            BulletListSchema
        ])
    )
});