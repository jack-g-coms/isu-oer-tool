"use client";

import { useState } from "react";
import type { KnowledgeDocument } from "@/prisma/client";
import KnowledgeDocumentType from "@/lib/types/KnowledgeDocumentType";
import { knowledgeDocColors, knowledgeDocBadgeColors, knowledgeDocBadgeTextColors, knowledgeDocStatusBadgeColors, knowledgeDocStatusBadgeTextColors } from "@/lib/constants/knowledgeDocColors";
import { retryIngest } from "@/lib/api/knowledge";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { FileText, Presentation, Info, Trash, School, RotateCcw, Pencil, Eye } from "lucide-react";
import Button from "../input/Button";

type CardProps = {
    data: KnowledgeDocument
}

export default function Card({ data }: CardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

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
            console.error(err);
            toast.error("Failed to retry, please try again later")
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-4 bg-white rounded-lg border border-gray-200 bg-white py-4 px-4 shadow-lg">
            <div className="flex flex-row gap-4 items-center">
                {data.type == KnowledgeDocumentType.PPTX ?
                    <Presentation
                        width={46}
                        height={46}
                        className={knowledgeDocColors[data.type]}
                    />
                :
                    <FileText
                        width={46}
                        height={46}
                        className={knowledgeDocColors[data.type]}
                    />
                }

                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">{data.title}</h3>
                    <div className="inline-flex gap-1">
                        <span title="Document Format" className={`text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold ${knowledgeDocBadgeColors[data.type]} ${knowledgeDocBadgeTextColors[data.type]}`} >{data.type}</span>
                        <span title="Status" className={`inline-flex items-center gap-1 text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold ${knowledgeDocStatusBadgeColors[data.status]} ${knowledgeDocStatusBadgeTextColors[data.status]}`} ><Info width={15} height={15}/>{data.status}</span>
                        <span title="Class" className={`inline-flex items-center gap-1 text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold truncate ${knowledgeDocBadgeColors["TEXT"]} ${knowledgeDocBadgeTextColors["TEXT"]}`} ><School width={15} height={15}/> {data.class}</span>
                    </div>
                </div>
            </div>

            <div className="inline-flex gap-2 w-fit">
                {data.status == "FAILED" &&
                    <Button onClick={handleRetry} loading={loading} loadingText="Requeueing...">
                        <RotateCcw width={20} height={20}/> Retry
                    </Button>
                }

                <Button variant="icon">
                    <Eye width={20} height={20}/>
                </Button>

                <Button variant="icon">
                    <Pencil width={20} height={20}/>
                </Button>

                <Button variant="icon">
                    <Trash width={20} height={20}/>
                </Button>
            </div>
        </div>
    );
}