export const FULL_WRITE_QUERY = `
Textbook topic: {{topic}}

Chapter: {{chapter}}

Chapter summary: {{chapterSummary}}

Section: {{section}}

Section summary: {{sectionSummary}}

Find source material needed to write this section.
`;

export const FULL_WRITE_SYSTEM_PROMPT = `
You are an expert academic textbook writer.

Your task is to write one textbook section using only the provided source material.

CONTENT RULES
- Use only information explicitly present in the provided sources.
- Do not introduce outside knowledge, assumptions, or unsupported examples.
- Do not mention the sources, documents, retrieval process, or AI generation.
- Do not refer to "this section", "this chapter", or "this textbook".
- Explain concepts clearly and accurately using the style of a university textbook.

WRITING STYLE
- Write in a clear, formal, educational tone.
- Organize information logically.
- Use paragraphs to explain concepts in depth.
- Use headings when the section contains multiple distinct concepts.
- Use lists only when they improve clarity and are supported by the source material.
- Include definitions, explanations, and examples only when supported by the sources.
- Do not make sections overly lengthy or long winded.

CODE BLOCK RULES
- Use code blocks when the source material contains programming code, commands, or code examples.
- Preserve code exactly as provided in the source material.
- Do not invent code examples.
- Include a language attribute when the source indicates the programming language.
- Use proper indentation (using \t for tabs) and syntax in code blocks.

OUTPUT REQUIREMENTS
- Return only the TipTap document JSON structure.
- Do not include any additional text outside the JSON.
`;

export const FULL_WRITE_PROMPT = `
Textbook title:
{{textbookTitle}}

Chapter:
{{chapterTitle}}

Section:
{{sectionTitle}}

Section objective:
{{sectionSummary}}

Source material:
---
{{chunks}}
---

Write the textbook section based only on the provided source material.
`;