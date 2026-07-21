import { auth } from "@/lib/utils/auth";
import TextbookEditor from "@/components/ui/textbooks/editor/TextbookEditor";
import { getTextbookWithSections } from "@/lib/services/textbooks";
import { getUserKnowledgeBase } from "@/lib/services/rag";
import { KnowledgeDocumentStatus, KnowledgeDocumentType } from "@/prisma/enums";

import Sidebar from "@/components/ui/textbooks/editor/Sidebar";
import Topbar from "@/components/ui/textbooks/editor/Topbar";
import { TriangleAlert } from "lucide-react";

type TextbookEditorPageProps = {
    params: Promise<{ [key: string]: string | undefined }>,
    searchParams: Promise<{ [key: string]: string | undefined }>
};

export default async function TextbookEditorPage({ params, searchParams }: TextbookEditorPageProps) {
    const session = await auth();
    const { id } = await params;
    const { chapter, section, kq, ktype, kpage } = await searchParams;
    if (!id) return;

    const knowledgeSearch = kq?.toLowerCase();
    const knowledgeType = ktype;
    const knowledgePage = Number(kpage ?? "1");

    const { data: readyData, total: readyTotal } = await getUserKnowledgeBase(
        session?.user.id as string, 
        false, 
        knowledgeSearch, 
        knowledgeType as KnowledgeDocumentType | undefined, 
        KnowledgeDocumentStatus.READY,
        knowledgePage
    );

    let textbook;
    let views;
    let chapterView;
    let sectionView;
    let loadError = false;
    try {
        textbook = await getTextbookWithSections(id, false, true);
        if (textbook?.authorId != session?.user.id || textbook?.status != "READY") {
            throw new Error("Unauthorized");
        }

        views = Object.fromEntries(textbook.chapters.map((chapter) => (
            [chapter.id, {
                ...chapter,
                sections: Object.fromEntries(chapter.sections.map((section) => (
                    [section.id, section]   
                )))
            }]
        )));

        chapterView = chapter && Object.keys(views).find(k => k == chapter) ? views[chapter] : undefined;
        sectionView = (section && chapterView && Object.keys(chapterView.sections).find(k => k == section)) ? chapterView.sections[section] : undefined;
    } catch (e) {
        textbook = undefined;
        loadError = true;
    }

    return (
        <>
            <Topbar
                textbook={textbook}
                knowledgeData={readyData}
                knowledgePage={knowledgePage}
                knowledgeTotal={readyTotal}
            />

            <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center lg:hidden mx-auto w-full max-w-8xl px-6 lg:px-10 py-8 gap-6">
                <TriangleAlert width={175} height={175} className="text-[var(--isu-gold)]"/>
                <h2 className="text-xl font-semibold text-center">
                    Textbook Editing is currently not available on mobile. Please switch to a Desktop to make edits to your Textbook content. There is a limited set of options in the top right menu.
                </h2>
            </div>

            <div className="hidden lg:flex flex-row">
                <Sidebar
                    chapterView={chapterView}
                    sectionView={sectionView}
                    initialViews={views}
                    textbook={textbook}
                />
                
                <div className="mx-auto flex-1 max-w-8xl px-6 lg:px-10 py-8 flex flex-row">
                    <TextbookEditor
                        chapterView = {chapterView}
                        sectionView = {sectionView}
                        textbook = {textbook}
                        views={views}
                        loadError={loadError}
                    />
                </div>
            </div>
        </>
    );
}