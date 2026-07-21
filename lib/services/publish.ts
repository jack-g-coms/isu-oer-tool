import TextbookWithSections from "../types/TextbookWithSections";
import puppeteer from "puppeteer";
import { getText, JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";

import extensions from "@/components/ui/input/tiptap/tiptap-templates/simple/extensions";
import { getTextbook, getTextbookWithSections, publishTextbook, unpublishTextbook } from "./textbooks";
import { deleteFile, getFile, getUrl, uploadFile } from "./uploads";

// Private
function generateChapterTOC(chapterNumber: number, sections: TextbookWithSections["chapters"][number]["sections"]): string {
    let toc = `
        <div class="chapter-toc">
            <h3>Contents</h3>
            <ul>
    `;

    sections.forEach((section) => {
        toc += `
            <li>
                <a href="#section-${chapterNumber}.${section.order + 1}">
                    ${section.order + 1} ${section.title}
                </a>
            </li>
        `;
    });

    toc += `
            </ul>
        </div>
    `;

    return toc;
}

function generateTableOfContents(textbook: TextbookWithSections): string {
    let toc = `
        <div class="toc">
            <h1>Table of Contents</h1>
            <ul>
    `;

    textbook.chapters.forEach((chapter) => {
        toc += `
            <li>
                <a href="#chapter-${chapter.order + 1}">
                    ${chapter.order + 1}. ${chapter.title}
                </a>
                <ul>
        `;

        chapter.sections.forEach((section) => {
            const sectionNumber = `${chapter.order + 1}.${section.order + 1}`;
            toc += `
                <li>
                    <a href="#section-${sectionNumber}">
                        ${sectionNumber} ${section.title}
                    </a>
                </li>
            `;
        });

        toc += `
                </ul>
            </li>
        `;
    });

    toc += `
            </ul>
        </div>
    `;

    return toc;
}

function generateFullHTML(textbook: TextbookWithSections & { author: { name: string } }): string {
    let body = "";
    const classInfo = textbook.class && textbook.class != "None" ? `<div class="cover-subtitle">${textbook.class}</div>` : "";

    body += `
        <div class="cover">
            <div class="cover-content">
                <h1>${textbook.title}</h1>

                ${classInfo}

                <div class="author">
                    By ${textbook.author.name}
                </div>

                <div class="cover-summary">
                    ${textbook.description}
                </div>

                <div class="metadata">
                    Created ${new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    `;
    body += generateTableOfContents(textbook);

    for (const chapter of textbook.chapters) {
        body += `<div class="chapter" id="chapter-${chapter.order + 1}">`;
        body += `
            <h1>Chapter ${chapter.order + 1}: ${chapter.title}</h1>
            <div class="summary chapter-summary">
                <strong>Overview</strong>
                <p>${chapter.summary}</p>
            </div>

            ${generateChapterTOC(
                chapter.order + 1,
                chapter.sections
            )}
        `;

        for (const section of chapter.sections) {
            if (!section.content) continue;
            
            body += `
                <div class="section" id="section-${chapter.order + 1}.${section.order + 1}">
                    <h2>${chapter.order + 1}.${section.order + 1} ${section.title}</h2>

                    <div class="summary section-summary">
                        <strong>Overview</strong>
                        <p>${section.summary}</p>
                    </div>

                    ${generateHTML(
                        section.content as JSONContent,
                        extensions
                    )}
                </div>
            `;
        }
    }

    body += `</div>`;
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    @page {
                        size: Letter;
                        margin: 0.75in;
                    }

                    body {
                        font-family: Georgia, "Times New Roman", serif;
                        line-height: 1.65;
                        color: #222;
                        margin: 0;
                    }

                    h1,
                    h2,
                    h3 {
                        margin-top: 0;
                        break-after: avoid;
                    }

                    .cover {
                        height: 90vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                        break-after: page;
                    }

                    .cover-content {
                        max-width: 650px;
                    }

                    .cover h1 {
                        font-size: 48px;
                        line-height: 1.15;
                        font-weight: 700;
                        margin: 0 0 24px;
                    }

                    .cover-subtitle {
                        font-size: 22px;
                        margin-bottom: 40px;
                        color: #444;
                    }

                    .author {
                        font-size: 20px;
                        font-style: italic;
                        margin-bottom: 50px;
                    }

                    .cover-summary {
                        font-size: 16px;
                        line-height: 1.8;
                        margin: 0 auto 50px;
                    }

                    .metadata {
                        font-size: 13px;
                        color: #666;
                    }

                    a {
                        color: inherit;
                        text-decoration: none;
                    }

                    a:hover {
                        text-decoration: underline;
                    }

                    .toc {
                        break-after: page;
                    }

                    .toc h1 {
                        font-size: 32px;
                        margin-bottom: 30px;
                    }

                    .toc ul {
                        list-style: none;
                        padding-left: 0;
                    }

                    .toc li {
                        margin: 10px 0;
                    }

                    .toc ul ul {
                        padding-left: 28px;
                    }

                    .chapter {
                        break-before: page;
                    }

                    .chapter h1 {
                        font-size: 34px;
                        line-height: 1.25;
                        margin: 0 0 20px;
                    }

                    .chapter-toc {
                        margin: 30px 0 45px;
                        padding: 18px 24px;
                        border-left: 4px solid #555;
                        background: #f7f7f7;
                        break-inside: avoid;
                    }

                    .chapter-toc h3 {
                        margin: 0 0 12px;
                        font-size: 18px;
                    }

                    .chapter-toc ul {
                        list-style: none;
                        padding-left: 0;
                        margin: 0;
                    }

                    .chapter-toc li {
                        margin: 8px 0;
                    }

                    .section {
                        break-inside: avoid;
                    }

                    .section h2 {
                        font-size: 24px;
                        line-height: 1.3;
                        margin: 40px 0 12px;
                    }

                    .summary {
                        margin: 20px 0 35px;
                        padding: 16px 20px;
                        background: #f7f7f7;
                        border-left: 4px solid #777;
                        font-size: 15px;
                        line-height: 1.6;
                    }

                    .summary strong {
                        display: block;
                        margin-bottom: 8px;
                        font-size: 14px;
                    }

                    p {
                        margin: 12px 0;
                    }

                    ul,
                    ol {
                        margin: 12px 0;
                        padding-left: 30px;
                    }

                    blockquote {
                        border-left: 4px solid #aaa;
                        padding-left: 16px;
                        margin-left: 0;
                        font-style: italic;
                    }

                    code {
                        font-family: "Courier New", monospace;
                    }

                    pre {
                        padding: 15px;
                        white-space: pre-wrap;
                        overflow-wrap: break-word;
                    }

                    img {
                        max-width: 100%;
                        height: auto;
                        display: block;
                        margin: 20px auto;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        break-inside: avoid;
                    }

                    td,
                    th {
                        border: 1px solid #ccc;
                        padding: 8px;
                    }

                    th {
                        font-weight: bold;
                    }

                    img,
                    table,
                    blockquote {
                        break-inside: avoid;
                    }
                </style>
            </head>

            <body>
                ${body}
            </body>
        </html>
    `;
}

async function generatePDF(html: string, title: string, isDraft: boolean): Promise<File> {
    const browser = await puppeteer.launch({
        headless: "shell"
    });
    console.log(await browser.version());
    const page = await browser.newPage();

    await page.setContent(html, {
        waitUntil: "load"
    });
    await page.waitForNetworkIdle();

    const pdf = await page.pdf({
        format: "Letter",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: isDraft,
        headerTemplate: isDraft
            ? `
                <div style="
                    width: 100%;
                    text-align: center;
                    font-size: 24px;
                    color: rgba(150,150,150,0.25);
                    font-family: Arial, sans-serif;
                ">
                    DRAFT
                </div>
            ` : "",
        footerTemplate: `
            <div style="
                width: 100%;
                text-align: center;
                font-size: 15px;
            ">
                <span class="pageNumber"></span>
            </div>
        `,
        margin: {
            top: "0.75in",
            bottom: "0.75in",
            left: "0.75in",
            right: "0.75in",
        },
    });
    await browser.close();

    return new File(
        [Buffer.from(pdf)],
        `${title}.pdf`,
        {
            type: "application/pdf"
        }
    );
}

// Public
export async function generateTextbookPDF(textbookId: string, isDraft: boolean): Promise<string> {
    const textbook = await getTextbookWithSections(textbookId, true);
    const html = generateFullHTML(textbook as TextbookWithSections & { author: { name: string }});
    const pdf = await generatePDF(html, textbook?.title as string, isDraft);

    const uploadKey = await uploadFile(pdf, "textbooks", `${isDraft ? "DRAFT" : "PUBLISHED"}-${textbook?.title}.pdf`);
    if (!isDraft) {
        await publishTextbook(textbookId, uploadKey);
    }

    return getUrl(uploadKey, "textbooks");
}

export async function getPublishedPDF(textbookId: string): Promise<Buffer> {
    const textbook = await getTextbook(textbookId);
    if (!textbook?.publishedUploadKey) {
        throw new Error("Textbook has never been published");
    } else {
        return await getFile(textbook.publishedUploadKey, "textbooks");
    }
}

export async function unpublishTextbookPDF(textbookId: string): Promise<void> {
    const textbook = await getTextbook(textbookId);
    if (!textbook?.publishedUploadKey) {
        throw new Error("Textbook has never been published");
    } else {
        await deleteFile(textbook.publishedUploadKey, "textbooks");
        await unpublishTextbook(textbookId);
    }
}