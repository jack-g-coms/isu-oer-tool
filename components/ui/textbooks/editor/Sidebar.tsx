"use client";

import { useState, useEffect } from "react";
import TextbookWithSections from "@/lib/types/TextbookWithSections";
import type { Chapter, Section } from "@/prisma/client";
import { useRouter, useSearchParams } from "next/navigation";

import Button from "../../input/Button";
import { BookOpen, CircleX, FileText, Pencil } from "lucide-react";

type SidebarProps = {
    chapterView: Chapter | undefined,
    sectionView: Section | undefined,
    views: Record<string, Chapter & { sections: Record<string, Section> }> | undefined,
    textbook: TextbookWithSections | undefined
};

export default function Sidebar({ chapterView, sectionView, views, textbook }: SidebarProps) {
    const [chapter, setChapter] = useState("");
    const [section, setSection] = useState("");

    if (!textbook || !views) return;

    const router = useRouter();
    const searchParams = useSearchParams();
    const params = new URLSearchParams(searchParams);

    useEffect(() => {
        if (chapter != "") {
            params.set("chapter", chapter);
        } else {
            params.delete("chapter");
        }
        if (section != "") {
            params.set("section", section);
        } else {
            params.delete("section");
        }

        router.push(`/textbooks/${textbook.id}/?${params.toString()}`);
    }, [chapter, section])

    return (
        <div className="flex flex-col w-full max-w-xs h-[calc(100vh-64px)] overflow-y-auto bg-white border-b border-r border-gray-200 gap-1.5 p-4">
            <p className="block text-sm uppercase font-semibold text-gray-500 tracking-tight pl-2">
                Outline
            </p>

            {Object.values(views).map((iChapter) => (
                <div className="space-y-1.5" key={iChapter.id}>
                    <Button 
                        icon={
                            <BookOpen className="shrink-0" width={20} height={20}/>
                        } 
                        variant="icon"
                        fixed={true}
                        className={`${!sectionView && chapterView?.id == iChapter.id ? "bg-gray-100" : ""}`}
                        onClick={() => {
                            setChapter(iChapter.id);
                            setSection("");
                        }}
                    >{iChapter.title}</Button>
                    
                    <div className="ml-5 space-y-1.5">
                        {Object.values(iChapter.sections).map((iSection) => (
                            <Button 
                                key={iSection.id} 
                                icon={
                                    <>
                                        {(iSection.status == "WRITING" || iSection.status == "QUEUED") &&
                                            <span title="Writing...">
                                                <Pencil className="shrink-0 text-blue-700" width={20} height={20}/>
                                            </span>
                                        }
                                        {(iSection.status == "FAILED_WRITING" || iSection.status == "FAILED_REFINING") &&
                                            <span title="Failed Writing">
                                                <CircleX className="shrink-0 text-[var(--isu-cardinal)]" width={20} height={20}/>
                                            </span>
                                        }
                                        <FileText className="shrink-0" width={20} height={20}/>
                                    </>
                                } 
                                className={`${sectionView && sectionView?.id == iSection.id ? "bg-gray-100" : ""}`}
                                variant="icon" 
                                fixed={true}
                                onClick={() => {
                                    setSection(iSection.id);
                                    setChapter(iSection.chapterId);
                                }}
                            >
                                {iSection.title}
                            </Button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}