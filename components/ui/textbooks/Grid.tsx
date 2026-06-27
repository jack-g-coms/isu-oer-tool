"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";

import Card from "./Card";
import TextbookWithSections from "@/lib/types/TextbookWithSections";

type GridProps = {
    data: TextbookWithSections[],
    search?: boolean
}

export default function Grid({ 
    data, 
    search=false
 }: GridProps) {
    const router = useRouter();
    const hasActiveJobs = data.some(
        d => d.status == "QUEUED" || d.status == "OUTLINING"
    );
    const hasActiveWritingJobs = data.some(textbook => 
        textbook.chapters.some(chapter => 
            chapter.sections.some(section => 
                section.status == "QUEUED" || section.status == "WRITING"
            )
        )
    );

    useEffect(() => {
        if (!hasActiveJobs && !hasActiveWritingJobs) return;

        const interval = setInterval(() => {
            router.refresh();
        }, 10000);

        return () => clearInterval(interval);
    }, [hasActiveJobs, hasActiveWritingJobs])

    return (
        <>
            {data.length >= 1 ?
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.map((value) => (
                        <Card
                            key={value.id}
                            data={value}
                        />
                    ))}
                </div>
            :
                <div className="flex flex-col gap-6 items-center bg-white p-8 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <Rocket height={175} width={175} className="text-[var(--isu-gold)]"/>
                    <h2 className="text-xl md:text-2xl font-semibold text-center">
                        {search ? 
                            "We couldn't find anything with these filters, try searching something different."
                        :
                            "Start building textbooks from your knowledge base."
                        }
                    </h2>
                </div>
            }
        </>
    );
}