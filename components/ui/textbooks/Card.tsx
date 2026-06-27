"use client";

import { useState } from "react";
import { textbookStatusBadgeTextColors, textbookStatusBadgeColors, textbookBadgeColors, textbookBadgeTextColors } from "@/lib/constants/textbookColors";
import { deleteTextbook, reOutline } from "@/lib/api/textbooks";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

import { Info, Trash, School, RotateCcw, Pencil, Eye, SquarePenIcon } from "lucide-react";
import Button from "../input/Button";
import TextbookWithSections from "@/lib/types/TextbookWithSections";

type CardProps = {
    data: TextbookWithSections,
}

export default function Card({ data }: CardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingView, setLoadingView] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    const canDelete = data.chapters.every(chapter => 
        chapter.sections.every(section => section.status == "READY" || section.status == "FAILED_REFINING" || section.status == "FAILED_WRITING")
    );
    const writingFailed = data.chapters.some(chapter => 
        chapter.sections.some(section => section.status == "FAILED_REFINING" || section.status == "FAILED_WRITING")
    );

    async function handleRetry() {
        if (loading) return;
        setLoading(true);

        try {
            const res = await reOutline(data.id);
            router.refresh();
            toast.success("Success");
            toast("Your textbook is being processed by our system. Check on its status in the Textbooks tab!", {
                duration: 10000
            });
        } catch (err) {
            if (err instanceof Error) {
                toast.error(`Failed: ${err.message}`);
            } else {
                toast.error("Failed: Unknown error");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (loadingDelete) return;

        const result = await Swal.fire({
            title: "Delete textbook?",
            text: "Your textbook will be removed. This action can't be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            confirmButtonColor: "#C8102E",
        });
        if (!result.isConfirmed) return;

        setLoadingDelete(true);
        try {
            const res = await deleteTextbook(data.id);
            router.refresh();
            toast.success("Success");
        } catch (err) {
            if (err instanceof Error) {
                toast.error(`Failed: ${err.message}`);
            } else {
                toast.error("Failed: Unknown error");
            }
        } finally {
            setLoadingDelete(false);
        } 
    }

    async function handleView() {
        if (loadingView) return;
        setLoadingView(true);

       
    }

    return (
        <div className="flex flex-col gap-4 bg-white rounded-lg border border-gray-200 bg-white py-4 px-4 shadow-lg">
            <div className="flex flex-row gap-4 items-center">
                <div className="flex flex-col flex-1 gap-1">
                    <h3 className="text-lg font-semibold">{data.title}</h3>
                    <div className="flex flex-row flex-wrap gap-1">
                        {data.status != "READY" ?
                            <span title="Status" className={`inline-flex items-center gap-1 text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold ${textbookStatusBadgeColors[data.status]} ${textbookStatusBadgeTextColors[data.status]}`} ><Info width={15} height={15}/>{data.status.replace("_", " ")}</span>
                        : !canDelete ?
                            <span title="Writing Status" className={`inline-flex items-center gap-1 text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold ${textbookStatusBadgeColors["OUTLINING"]} ${textbookStatusBadgeTextColors["OUTLINING"]}`} ><SquarePenIcon width={15} height={15}/>WRITING</span>
                        : writingFailed ?
                            <span title="Writing Status" className={`inline-flex items-center gap-1 text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold ${textbookStatusBadgeColors["FAILED_OUTLINING"]} ${textbookStatusBadgeTextColors["FAILED_OUTLINING"]}`} ><Info width={15} height={15}/>FAILED WRITING</span>
                        : 
                            <span title="Status" className={`inline-flex items-center gap-1 text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold ${textbookStatusBadgeColors[data.status]} ${textbookStatusBadgeTextColors[data.status]}`} ><Info width={15} height={15}/>{data.status.replace("_", " ")}</span>
                        }
                        <span title="Class" className={`inline-flex items-center max-w-[140px] gap-1 text-xs p-1.5 tracking-tight rounded-xl font-semibold overflow-hidden whitespace-nowrap text-ellipsis ${textbookBadgeColors["CLASS"]} ${textbookBadgeTextColors["CLASS"]}`} >
                            <School width={15} height={15} className="shrink-0"/>
                            <span className="truncate">{data.class}</span>
                        </span>
                    </div>
                </div>
            </div>
            
            <p className="line-clamp-2 text-md">
                {data.description}
            </p>

            <div className="inline-flex gap-2 w-fit">
                {data.status == "FAILED_OUTLINING" &&
                    <Button onClick={handleRetry} loading={loading} loadingText="Requeueing...">
                        <RotateCcw width={20} height={20}/> Retry
                    </Button>
                }

                {data.status == "READY" &&
                    <>
                        <Button onClick={handleView} loading={loadingView} loadingText="Retrieving..." variant="icon">
                            <Eye width={20} height={20}/>
                        </Button>

                        <Button 
                            variant="icon"
                            onClick={() => {
                                
                            }}
                        >
                            <Pencil width={20} height={20}/>
                        </Button>

                        {canDelete &&
                            <Button onClick={handleDelete} loading={loadingDelete} loadingText="Deleting..." variant="icon">
                                <Trash width={20} height={20}/>
                            </Button>
                        }
                    </>
                }
            </div>
        </div>
    );
}