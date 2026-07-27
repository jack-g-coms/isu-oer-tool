import { z } from "zod";

const MarkSchema = z.object({
    type: z.enum([
        "bold",
        "italic",
        "code",
        "highlight",
        "superscript",
        "subscript",
        "link",
    ]),
    attrs: z.object({
        href: z.string().nullable(),
        color: z.string().nullable(),
    }).nullable(),
});

const TextNodeSchema = z.object({
    type: z.literal("text"),
    text: z.string().min(1),
    marks: z.array(MarkSchema).nullable(),
});

const InlineContentSchema = z.array(TextNodeSchema);

const ParagraphSchema = z.object({
    type: z.literal("paragraph"),
    attrs: z.object({
        textAlign: z.enum([
            "left",
            "center",
            "right",
            "justify"
        ]).nullable(),
    }).nullable(),
    content: InlineContentSchema,
});

const HeadingSchema = z.object({
    type: z.literal("heading"),
    attrs: z.object({
        level: z.number().min(1).max(6),
        textAlign: z.enum([
            "left",
            "center",
            "right",
            "justify"
        ]).nullable(),
    }),
    content: InlineContentSchema,
});


const BlockquoteSchema = z.object({
    type: z.literal("blockquote"),
    content: z.array(
        z.union([
            ParagraphSchema,
            HeadingSchema
        ])
    ),
});


const CodeBlockSchema = z.object({
    type: z.literal("codeBlock"),
    attrs: z.object({
        language: z.string().nullable(),
    }).nullable(),
    content: InlineContentSchema,
});


const HorizontalRuleSchema = z.object({
    type: z.literal("horizontalRule"),
    attrs: z.null(),
});

const ListItemSchema = z.object({
    type: z.literal("listItem"),
    content: z.array(
        ParagraphSchema
    ),
});


const BulletListSchema = z.object({
    type: z.literal("bulletList"),
    content: z.array(ListItemSchema),
});


const OrderedListSchema = z.object({
    type: z.literal("orderedList"),
    attrs: z.object({
        start: z.number().nullable(),
    }),
    content: z.array(ListItemSchema),
});

const DocNodeSchema = z.union([
    ParagraphSchema,
    HeadingSchema,
    BulletListSchema,
    OrderedListSchema,
    BlockquoteSchema,
    CodeBlockSchema,
    HorizontalRuleSchema,
]);

export const SectionContentResponse = z.object({
    type: z.literal("doc"),
    content: z.array(DocNodeSchema),
});