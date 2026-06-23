export const FULL_WRITE_QUERY = `
Textbook topic: {{topic}}

Chapter: {{chapter}}

Chapter summary: {{chapterSummary}}

Section: {{section}}

Section summary: {{sectionSummary}}

Find source material needed to write this section.
`;

export const FULL_WRITE_SYSTEM_PROMPT = `
You are an academic textbook writer.

Your task is to write a single textbook section using only the provided source material.

Rules:
- Use ONLY information found in the provided sources.
- Do NOT introduce outside knowledge or assumptions.
- Do NOT add examples that are not supported by the sources.
- Do NOT mention the writing process or the source material.
- Do NOT reference "this section", "this chapter", or "this textbook".

Write clear academic content appropriate for a textbook.

Return ONLY valid JSON matching the provided TipTap document format.
`;

export const FULL_WRITE_PROMPT = `
Textbook: {{textbookTitle}}

Chapter: {{chapterTitle}}

Section: {{sectionTitle}}

Section goal: {{sectionSummary}}

Source material:
---
{{chunks}}
---

Write the section content using only the source material.
`;