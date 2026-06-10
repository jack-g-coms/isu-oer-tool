import { KnowledgeDocument, KnowledgeDocumentType } from "@/prisma/client";
import { knowledgeDocColors, knowledgeDocBadgeColors, knowledgeDocBadgeTextColors } from "@/lib/constants/knowledgeDocColors";

import { FileText, Presentation } from "lucide-react";

type CardProps = {
    data: KnowledgeDocument
}

export default function Card({ data }: CardProps) {
    return (
        <div className="flex flex-col gap-2 bg-white rounded-lg border border-gray-200 bg-white py-4 px-4 shadow-lg space-y-6">
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
                    <span className={`text-xs w-fit p-1.5 tracking-tight rounded-xl font-semibold ${knowledgeDocBadgeColors[data.type]} ${knowledgeDocBadgeTextColors[data.type]}`} >{data.type}</span>
                </div>
            </div>
        </div>
    );
}