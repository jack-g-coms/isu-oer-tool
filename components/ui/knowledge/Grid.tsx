"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { KnowledgeDocument } from "@/prisma/client"

import Card from "./Card";

type GridProps = {
    data: KnowledgeDocument[]
}

export default function Grid({ data }: GridProps) {
    const router = useRouter();
    const hasActiveJobs = data.some(
        d => d.status == "QUEUED" || d.status == "PROCESSING"
    );

    useEffect(() => {
        if (!hasActiveJobs) return;

        const interval = setInterval(() => {
            router.refresh();
        }, 10000);

        return () => clearInterval(interval);
    }, [hasActiveJobs])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.map((value) => (
                <Card
                    key={value.id}
                    data={value}
                />
            ))}
        </div>
    );
}