"use client";

import { useState } from "react";
import type { KnowledgeDocument } from "@/prisma/client";
import KnowledgeDocumentType from "@/lib/types/KnowledgeDocumentType";
import { knowledgeDocColors, knowledgeDocBadgeColors, knowledgeDocBadgeTextColors, knowledgeDocStatusBadgeColors, knowledgeDocStatusBadgeTextColors } from "@/lib/constants/knowledgeDocColors";
import { deleteKnowledgeDocument, getKnowledgeDocumentUrl, retryIngest } from "@/lib/api/knowledge";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/components/stores/Modals";

import { FileText, Presentation, Info, Trash, School, RotateCcw, Pencil, Eye } from "lucide-react";
import Button from "../input/Button";
import UpdateKnowledgeDocumentModal from "../modals/UpdateKnowledgeDocumentModal";

type CardProps = {
    data: KnowledgeDocument
}

export default function Card({ data }: CardProps) {
    const open = useModalStore((state) => state.open);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingView, setLoadingView] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    async function handleRetry() {
        if (loading) return;
        setLoading(true);

        try {
            const res = await retryIngest(data.id);
            router.refresh();
            toast.success("Success");
            toast("Your document is being processed by our system. Check on its status in the Knowledge Base!", {
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
            title: "Delete document?",
            text: "Your AI-ready source will be removed. This action can't be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            confirmButtonColor: "#C8102E",
        });
        if (!result.isConfirmed) return;

        setLoadingDelete(true);
        try {
            const res = await deleteKnowledgeDocument(data.id);
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

        try {
            const res = await getKnowledgeDocumentUrl(data.id);
            window.open(res.data, "_blank", "noopener,noreferrer")
        } catch (err) {
            if (err instanceof Error) {
                toast.error(`Failed: ${err.message}`);
            } else {
                toast.error("Failed: Unknown error");
            }
        } finally {
            setLoadingView(false);
        } 
    }

    return (
        <div className="flex flex-col gap-4 bg-white rounded-lg border border-gray-200 bg-white py-4 px-4 shadow-lg">
            <div className="flex flex-row gap-4 items-center">
                {data.type == KnowledgeDocumentType.PPTX ?
                    <Presentation
                        width={46}
                        height={46}
                        className={`${knowledgeDocColors[data.type]} shrink-0`}
                    />
                :
                    <FileText
                        width={46}
                        height={46}
                        className={`${knowledgeDocColors[data.type]} shrink-0`}
                    />
                }

                <div className="flex flex-col flex-1">
                    <h3 className="text-lg font-semibold">{data.title}</h3>
                    <div className="flex flex-row flex-wrap gap-1">
                        <span title="Document Format" className={`text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold ${knowledgeDocBadgeColors[data.type]} ${knowledgeDocBadgeTextColors[data.type]}`} >{data.type}</span>
                        <span title="Status" className={`inline-flex items-center gap-1 text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold ${knowledgeDocStatusBadgeColors[data.status]} ${knowledgeDocStatusBadgeTextColors[data.status]}`} ><Info width={15} height={15}/>{data.status}</span>
                        <span title="Class" className={`inline-flex items-center max-w-[140px] gap-1 text-xs p-1.5 tracking-tight rounded-xl font-semibold overflow-hidden whitespace-nowrap text-ellipsis ${knowledgeDocBadgeColors["TEXT"]} ${knowledgeDocBadgeTextColors["TEXT"]}`} >
                            <School width={15} height={15} className="shrink-0"/>
                            <span className="truncate">{data.class}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="inline-flex gap-2 w-fit">
                {data.status == "FAILED" &&
                    <Button onClick={handleRetry} loading={loading} loadingText="Requeueing...">
                        <RotateCcw width={20} height={20}/> Retry
                    </Button>
                }

                <Button onClick={handleView} loading={loadingView} loadingText="Retrieving..." variant="icon">
                    <Eye width={20} height={20}/>
                </Button>

                {data.status == "READY" &&
                    <>
                        <Button 
                            variant="icon"
                            onClick={() => {
                                open(<UpdateKnowledgeDocumentModal initialData={data}/>);
                            }}
                        >
                            <Pencil width={20} height={20}/>
                        </Button>

                        <Button onClick={handleDelete} loading={loadingDelete} loadingText="Deleting..." variant="icon">
                            <Trash width={20} height={20}/>
                        </Button>
                    </>
                }
            </div>
        </div>
    );
}