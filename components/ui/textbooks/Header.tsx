"use client";

import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useModalStore } from "@/components/stores/Modals";
import { useRouter, useSearchParams } from "next/navigation";

import Button from "@/components/ui/input/Button";
import NewTextbookModal from "../modals/NewTextbookModal";
import Input from "../input/Input";
import Dropdown from "../input/Dropdown";
import type { KnowledgeDocument } from "@/prisma/client";

type HeaderProps = {
    knowledgeData: KnowledgeDocument[],
    knowledgePage: number,
    knowledgeTotal: number
}

export default function Header({
    knowledgeData,
    knowledgePage,
    knowledgeTotal
}: HeaderProps) {
    const searchParams = useSearchParams();
    const params = new URLSearchParams(searchParams);

    const router = useRouter();
    const { updateProps, open, current } = useModalStore();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        const trimmed = search.trim();
        const timeout = setTimeout(() => {
            if (trimmed.length != 0) {
                params.set("q", trimmed);
            } else {
                params.delete("q");
            }
            router.push(`/textbooks?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (status != "") {
            params.set("status", status);
        } else {
            params.delete("status");
        }
        router.push(`/textbooks?${params.toString()}`);
    }, [status])

    useEffect(() => {
        const active = current();
        if (active && active.component == NewTextbookModal) {
            updateProps({
                data: knowledgeData,
                page: knowledgePage,
                total: knowledgeTotal
            });
        }
    }, [knowledgeData, knowledgePage, knowledgeTotal]);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-[5fr_1fr] gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Textbooks</h1>
                    <h4 className="text-lg">Create, organize, and refine textbooks from your knowledge sources in one place.</h4>
                </div>

                <div>
                    <Button
                        onClick={() => {
                            open(NewTextbookModal, {
                                data: knowledgeData,
                                page: knowledgePage,
                                total: knowledgeTotal
                            });
                        }}
                    >
                        <Plus width={20} height={20}/> New Textbook
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[6fr_1.5fr] gap-2 rounded-lg border border-gray-200 bg-white py-2 px-2 shadow-lg">
                <Input
                    value={search}
                    search={true}
                    onClear={() => setSearch("")}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                    placeholder="Search by title, description, or class..."
                />

                <Dropdown
                    options={[
                        {
                            label: "All processing statuses",
                            value: ""
                        },
                        {
                            label: "Queued",
                            value: "QUEUED"
                        },
                        {
                            label: "Outlining",
                            value: "OUTLINING"
                        },
                        {
                            label: "Failed",
                            value: "FAILED_OUTLINING"
                        },
                        {
                            label: "Ready",
                            value: "READY"
                        }
                    ]}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="All processing statuses"
                />
            </div>
        </div>
    );
}