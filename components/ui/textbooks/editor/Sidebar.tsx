"use client";

import { useState, useEffect } from "react";
import TextbookWithSections from "@/lib/types/TextbookWithSections";
import type { Chapter, Section } from "@/prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useModalStore } from "@/components/stores/Modals";

import Button from "../../input/Button";
import { BookOpen, CircleX, FileText, Pencil, Plus, TableOfContents } from "lucide-react";
import Swal from "sweetalert2";
import NewChapterModal from "../../modals/NewChapterModal";
import NewSectionModal from "../../modals/NewSectionModal";

type SidebarProps = {
    chapterView: Chapter | undefined,
    sectionView: Section | undefined,
    views: Record<string, Chapter & { sections: Record<string, Section> }> | undefined,
    textbook: TextbookWithSections | undefined
};

export default function Sidebar({ chapterView, sectionView, views, textbook }: SidebarProps) {
    const [chapter, setChapter] = useState(chapterView?.id ?? "");
    const [section, setSection] = useState(sectionView?.id ?? "");

    const open = useModalStore((state) => state.open);

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

    useEffect(() => {
        setChapter(chapterView?.id ?? "");
        setSection(sectionView?.id ?? "");
    }, [chapterView, sectionView]);

    return (
        <div className="flex flex-col w-full max-w-xs h-[calc(100vh-64px)] overflow-y-auto sticky top-16 bg-[#fafafa] border-b border-r border-gray-200 gap-1.5 p-4 shrink-0">
            <p className="block text-sm uppercase font-semibold text-gray-500 tracking-tight">
                Outline
            </p>
            <Button 
                variant="secondary" 
                className="py-1!"
                onClick={() => open(NewChapterModal, {
                    textbookId: textbook.id
                })}
            ><Plus className="shrink-0" width={20} height={20}/> Add Chapter</Button>

            <Button 
                icon={
                    <TableOfContents className="shrink-0" width={20} height={20}/>
                }
                variant="icon"
                fixed={true}
                title="Table of Contents"
                className={`${!sectionView && !chapterView ? "bg-gray-100" : ""}`}
                onClick={() => {
                    if (sectionView && sectionView.status != "WRITING" && sectionView.status != "QUEUED" && sectionView.status != "FAILED_WRITING") {
                        Swal.fire({
                            title: "Are you sure?",
                            text: "Are you sure you want to navigate away from this section? Any unsaved changes will be lost.",
                            icon: "warning",
                            showCancelButton: true
                        })
                        .then((res) => {
                            if (res.isConfirmed) {
                                setChapter("");
                                setSection("");
                            }
                        })
                    } else {
                        setChapter("");
                        setSection("");
                    }
                }}
            >Overview</Button>

            {Object.values(views).map((iChapter) => (
                <div className="space-y-1.5 group/chapter" key={iChapter.id}>
                    <Button 
                        icon={
                            <BookOpen className="shrink-0" width={20} height={20}/>
                        } 
                        variant="icon"
                        fixed={true}
                        title={iChapter.title}
                        className={`${!sectionView && chapterView?.id == iChapter.id ? "bg-gray-100" : ""}`}
                        onClick={() => {
                            if (sectionView && sectionView.status != "WRITING" && sectionView.status != "QUEUED" && sectionView.status != "FAILED_WRITING") {
                                Swal.fire({
                                    title: "Are you sure?",
                                    text: "Are you sure you want to navigate away from this section? Any unsaved changes will be lost.",
                                    icon: "warning",
                                    showCancelButton: true
                                })
                                .then((res) => {
                                    if (res.isConfirmed) {
                                        setChapter(iChapter.id);
                                        setSection("");
                                    }
                                })
                            } else {
                                setChapter(iChapter.id);
                                setSection("");
                            }
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
                                title={iSection.title}
                                className={`${sectionView && sectionView?.id == iSection.id ? "bg-gray-100" : ""}`}
                                variant="icon" 
                                fixed={true}
                                onClick={() => {
                                    if (sectionView && sectionView.status != "WRITING" && sectionView.status != "QUEUED" && sectionView.status != "FAILED_WRITING") {
                                        Swal.fire({
                                            title: "Are you sure?",
                                            text: "Are you sure you want to navigate away from this section? Any unsaved changes will be lost.",
                                            icon: "warning",
                                            showCancelButton: true
                                        })
                                        .then((res) => {
                                            if (res.isConfirmed) {
                                                setSection(iSection.id);
                                                setChapter(iSection.chapterId);
                                            }
                                        })
                                    } else {
                                        setSection(iSection.id);
                                        setChapter(iSection.chapterId);
                                    }
                                }}
                            >
                                {iSection.title}
                            </Button>
                        ))}

                        <Button
                            className="py-1! group-hover/chapter:inline-flex! hidden!"
                            onClick={() => open(NewSectionModal, {
                                chapterId: iChapter.id
                            })}
                        ><Plus className="shrink-0" width={20} height={20}/> Add Section</Button>
                    </div>
                </div>
            ))}
        </div>
    );
}