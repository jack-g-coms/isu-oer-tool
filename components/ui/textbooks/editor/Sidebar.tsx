"use client";

import { DragDropProvider, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/react";
import { useState, useEffect } from "react";
import TextbookWithSections from "@/lib/types/TextbookWithSections";
import type { Chapter, Section } from "@/prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useModalStore } from "@/components/stores/Modals";
import toast from "react-hot-toast";

import Button from "../../input/Button";
import { BookOpen, CircleX, FileText, Pencil, Plus, TableOfContents } from "lucide-react";
import Swal from "sweetalert2";
import NewChapterModal from "../../modals/NewChapterModal";
import NewSectionModal from "../../modals/NewSectionModal";
import Draggable from "../../input/Draggable";
import Droppable from "../../input/Droppable";
import { moveSection } from "@/lib/api/sections";
import { moveChapter } from "@/lib/api/chapters";

type SidebarProps = {
    chapterView: Chapter | undefined,
    sectionView: Section | undefined,
    initialViews: Record<string, Chapter & { sections: Record<string, Section> }> | undefined,
    textbook: TextbookWithSections | undefined
};

export default function Sidebar({ chapterView, sectionView, initialViews, textbook }: SidebarProps) {
    const [chapter, setChapter] = useState(chapterView?.id ?? "");
    const [section, setSection] = useState(sectionView?.id ?? "");
    const [reordering, setReordering] = useState(false);
    const [views, setViews] = useState(initialViews);

    const [dragging, setDragging] = useState(false); 
    const [draggingSection, setDraggingSection] = useState<Section | null>();
    const [draggingChapter, setDraggingChapter] = useState<Chapter | null>();
    const [dragType, setDragType] = useState<"section" | "chapter" | null>();

    const open = useModalStore((state) => state.open);

    if (!textbook || !views) return;

    const router = useRouter();
    const searchParams = useSearchParams();
    const params = new URLSearchParams(searchParams);

    useEffect(() => {
        setViews(initialViews);
    }, [initialViews])

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
    
    function handleDragStart(e: DragStartEvent) {
        setDragging(true);

        const { source } = e.operation;
        if (!source || !views) return;

        const sourceSplit = source.id.toString().split("-");
        const sourceType = sourceSplit[0];

        if (sourceType == "section") {
            const [, chapterId, sectionId] = sourceSplit;
            if (!chapterId || !sectionId) return;

            setDragType("section");
            setDraggingSection(views[chapterId].sections[sectionId]);
        } else {
            const [, chapterId] = sourceSplit;
            if (!chapterId) return;

            setDragType("chapter");
            setDraggingChapter(views[chapterId]);
        }
    }

    async function handleDragEnd(e: DragEndEvent) {
        setDragging(false);
        setDraggingSection(null);
        setDraggingChapter(null);

        if (e.canceled || !views || reordering) return;

        const { source, target } = e.operation;
        if (!source || !target) return;

        const sourceSplit = source.id.toString().split("-");
        const targetSplit = target.id.toString().split("-");

        const sourceType = sourceSplit[0];
        const targetType = targetSplit[0];

        if (sourceType == "section" && (targetType == "beforeSection" || targetType == "afterSection")) {
            const [, sourceChapterId, sourceSectionId] = sourceSplit;

            const sourceSection = views[sourceChapterId]?.sections[sourceSectionId];
            if (!sourceSection) return;

            let targetChapterId: string;
            let targetSectionId: string | undefined;
            let position: "before" | "after";

            if (targetType === "beforeSection") {
                const [, chapterId, sectionId] = targetSplit;

                targetChapterId = chapterId;
                targetSectionId = sectionId;
                position = "before";

                if (sourceChapterId === targetChapterId && sourceSectionId === targetSectionId) {
                    return;
                }
            } else {
                const [, chapterId] = targetSplit;

                targetChapterId = chapterId;
                position = "after";
            }

            const previousViews = structuredClone(views);
            const newViews = structuredClone(views);

            delete newViews[sourceChapterId].sections[sourceSectionId];

            const targetSections = Object.values(
                newViews[targetChapterId].sections
            );

            if (targetType === "beforeSection" && targetSectionId) {
                const targetIndex = targetSections.findIndex(
                    section => section.id === targetSectionId
                );

                if (targetIndex === -1) return;

                targetSections.splice(
                    targetIndex,
                    0,
                    {
                        ...sourceSection,
                        chapterId: targetChapterId
                    }
                );
            } else {
                targetSections.push({
                    ...sourceSection,
                    chapterId: targetChapterId
                });
            }

            newViews[targetChapterId].sections = Object.fromEntries(
                targetSections.map(section => [
                    section.id,
                    section
                ])
            );

            setReordering(true);
            setViews(newViews);

            try {
                await moveSection(sourceSection.id, {
                    chapterId: targetChapterId,
                    targetSectionId,
                    position
                });
                router.refresh();
            } catch (err) {
                setViews(previousViews);
                if (err instanceof Error) {
                    toast.error(`Failed: ${err.message}`);
                } else {
                    toast.error("Failed: Unknown error");
                }
            } finally {
                setReordering(false);
            }
        } else if (sourceType == "chapter" && (targetType == "beforeChapter" || targetType == "afterChapter")) {
            const [, sourceChapterId] = sourceSplit;

            const sourceChapter = views[sourceChapterId];
            if (!sourceChapter) return;

            let targetChapterId: string | undefined;
            let position: "before" | "after";

            if (targetType === "beforeChapter") {
                const [, chapterId] = targetSplit;

                targetChapterId = chapterId;
                position = "before";

                if (sourceChapterId === targetChapterId) {
                    return;
                }
            } else {
                position = "after";
            }

            const previousViews = structuredClone(views);
            let newViews = structuredClone(views);

            delete newViews[sourceChapterId];
            const targetChapters = Object.values(newViews);

            if (targetType === "beforeChapter" && targetChapterId) {
                const targetIndex = targetChapters.findIndex(
                    chapter => chapter.id === targetChapterId
                );

                if (targetIndex === -1) return;

                targetChapters.splice(
                    targetIndex,
                    0,
                    sourceChapter
                );
            } else {
                targetChapters.push(sourceChapter);
            }

            newViews = Object.fromEntries(
                targetChapters.map(chapter => [
                    chapter.id,
                    chapter
                ])
            );

            setReordering(true);
            setViews(newViews);

            try {
                await moveChapter(sourceChapter.id, {
                    targetChapterId,
                    position
                });
                router.refresh();
            } catch (err) {
                setViews(previousViews);
                if (err instanceof Error) {
                    toast.error(`Failed: ${err.message}`);
                } else {
                    toast.error("Failed: Unknown error");
                }
            } finally {
                setReordering(false);
            }
        }
    }

    return (
        <div className="flex flex-col w-full max-w-xs h-[calc(100vh-64px)] overflow-y-auto sticky top-16 bg-[#fafafa] border-b border-r border-gray-200 p-4 shrink-0 pb-20">
            <p className="block text-sm uppercase font-semibold text-gray-500 tracking-tight mb-1.5">
                Outline
            </p>
            <Button 
                variant="secondary" 
                className="py-1! mb-1.5"
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
                title="Overview"
                className={`mb-1.5 ${!sectionView && !chapterView ? "bg-gray-100" : ""}`}
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

            <DragDropProvider
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
            >
                {Object.values(views).map((iChapter) => (
                    <div className="group/chapter flex flex-col" key={iChapter.id}>
                        <Droppable disabled={dragType != "chapter"} isDragging={dragging} id={`beforeChapter-${iChapter.id}`}/>
                        <Draggable
                            id={`chapter-${iChapter.id}`} 
                            icon={
                                <BookOpen className="shrink-0" width={20} height={20}/>
                            } 
                            variant="icon"
                            fixed={true}
                            title={iChapter.title}
                            className={`mb-1.5 ${!sectionView && chapterView?.id == iChapter.id ? "bg-gray-100" : ""}`}
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
                        >{iChapter.title}</Draggable>
                        
                        <div className="ml-5 flex flex-col">
                            {Object.values(iChapter.sections).map((iSection, pIndex) => (
                                <div key={iSection.id} className={draggingSection?.id == iSection.id ? "opacity-50" : ""}>
                                    <Droppable disabled={dragType != "section"} isDragging={dragging} id={`beforeSection-${iChapter.id}-${iSection.id}`}/>
                                    <Draggable
                                        id={`section-${iChapter.id}-${iSection.id}`}
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
                                        className={`mb-1.5 ${sectionView && sectionView?.id == iSection.id ? "bg-gray-100" : ""}`}
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
                                    </Draggable>
                                </div>
                            ))}

                            <Droppable disabled={dragType != "section"} isDragging={dragging} id={`afterSection-${iChapter.id}`}/>

                            {!dragging &&
                                <Button
                                    className="py-1! group-hover/chapter:inline-flex! hidden! mb-1.5"
                                    onClick={() => open(NewSectionModal, {
                                        chapterId: iChapter.id
                                    })}
                                >
                                    <Plus className="shrink-0" width={20} height={20}/> Add Section
                                </Button>
                            }
                        </div>
                    </div>
                ))}

                <div>
                    <Droppable disabled={false} isDragging={dragging} id="afterChapter"/>
                </div>

                <DragOverlay>
                    {draggingSection &&
                        <Button
                            icon={
                                <>
                                    {(draggingSection.status == "WRITING" || draggingSection.status == "QUEUED") &&
                                        <span title="Writing...">
                                            <Pencil className="shrink-0 text-blue-700" width={20} height={20}/>
                                        </span>
                                    }
                                    {(draggingSection.status == "FAILED_WRITING" || draggingSection.status == "FAILED_REFINING") &&
                                        <span title="Failed Writing">
                                            <CircleX className="shrink-0 text-[var(--isu-cardinal)]" width={20} height={20}/>
                                        </span>
                                    }
                                    <FileText className="shrink-0" width={20} height={20}/>
                                </>
                            }
                            className="bg-white shadow-lg border border-gray-200"
                            variant="icon" 
                            fixed={true}
                        >
                            {draggingSection.title}
                        </Button>
                    }

                    {draggingChapter &&
                        <Button
                            icon={
                                <BookOpen className="shrink-0" width={20} height={20}/>
                            } 
                            variant="icon"
                            fixed={true}
                            title={draggingChapter.title}
                            className="bg-white shadow-lg border border-gray-200"
                        >{draggingChapter.title}</Button>
                    }
                </DragOverlay>
            </DragDropProvider>
        </div>
    );
}