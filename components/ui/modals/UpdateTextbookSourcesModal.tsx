"use client";

import type { KnowledgeDocument } from "@/prisma/client";
import { useState, useEffect } from "react";
import { useModalStore } from "@/components/stores/Modals";
import { updateTextbook } from "@/lib/api/textbooks";
import toast from "react-hot-toast";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TextbookWithSections from "@/lib/types/TextbookWithSections";

import { textbookStatusBadgeColors, textbookStatusBadgeTextColors } from "@/lib/constants/textbookColors";
import { FileText, Upload, CircleX, Brain } from "lucide-react";
import Input from "../input/Input";
import TextArea from "../input/TextArea";
import Button from "../input/Button";
import SearchHeader from "../knowledge/SearchHeader";
import Grid from "../knowledge/Grid";
import Pagination from "../input/Pagination";

type UpdateTextbookSourcesModalProps = {
    textbookData: TextbookWithSections,
    data: KnowledgeDocument[],
    page: number,
    total: number
}

export default function UpdateTextbookSourcesModal({ 
    textbookData,
    data,
    page,
    total 
}: UpdateTextbookSourcesModalProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = new URLSearchParams(searchParams);

    const router = useRouter();

    const [title, setTitle] = useState(textbookData.title ?? "");
    const [description, setDescription] = useState(textbookData.description ?? "");
    const [sources, setSources] = useState<Record<string, boolean>>(Object.fromEntries(textbookData.sources.map((source) => [source.id, true])));
    const [className, setClassName] = useState(textbookData.class);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [fileType, setFileType] = useState("");

    const close = useModalStore((state) => state.close);

    useEffect(() => {
        const trimmed = search.trim();
        const timeout = setTimeout(() => {
            if (trimmed.length != 0) {
                params.set("kq", trimmed);
            } else {
                params.delete("kq");
            }
            router.push(`${pathname}?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (fileType != "") {
            params.set("ktype", fileType);
        } else {
            params.delete("ktype");
        }

        router.push(`${pathname}?${params.toString()}`);
    }, [fileType])

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        if (loading) return;

        const sourceIds = Object.keys(sources);
        if (sourceIds.length == 0) {
            toast.error("You must select at least one source.");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("class", className.length == 0 ? "None" : className);
        for (const sourceId of sourceIds) {
            formData.append("sources", sourceId);
        }

        setLoading(true);
        try {
            const textbook = await updateTextbook(textbookData.id, formData);
            close();
            params.delete("kq");
            params.delete("ktype");
            params.delete("kpage");
            router.push(`${pathname}?${params.toString()}`); 
            router.refresh();
            toast.success("Success");
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

    function onSelect(doc: KnowledgeDocument) {
        setSources((old) => {
            const updated = { ...old };
            if (updated[doc.id]) {
                delete updated[doc.id];
            } else {
                updated[doc.id] = true;
            }
            return updated;
        });
    };

    return (
        <div className="w-full h-screen md:max-h-[calc(100vh-4rem)] md:w-4xl md:rounded-lg border border-gray-200 bg-white p-1 shadow-lg flex">
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-full flex flex-col py-6 px-6 gap-6">
                <div className="space-y-4">
                    <div className="inline-flex gap-2">
                        <Brain width={30} height={30}/>
                        <h1 className="text-2xl font-bold">Textbook Sources</h1>
                    </div>
                    <p className="text-md"><strong>Note: </strong> Existing AI-generated content in this textbook using removed sources will not be deleted. The selected sources will be used for future AI-generated content in this textbook.</p>
                    <p title="Selections" className={`text-sm p-1.5 w-fit tracking-tight rounded-xl font-semibold ${textbookStatusBadgeColors["QUEUED"]} ${textbookStatusBadgeTextColors["QUEUED"]}`} >
                        Sources: {Object.entries(sources).length}
                    </p>
                </div>

                <div className="flex flex-col flex-1 gap-6 justify-between">
                    <div className="space-y-6">
                        <SearchHeader
                            search={search}
                            setSearch={setSearch}
                            fileType={fileType}
                            setFileType={setFileType}
                            includeDocStatus={false}
                        />

                        <Grid
                            data={data}
                            canEditDelete={false}
                            search={search != "" || fileType != ""}
                            layout="grid-cols-1 md:grid-cols-2"
                            canSelect={true}
                            selections={sources}
                            onSelect={onSelect}
                        />

                        <Pagination
                            page={page}
                            total={total}
                            limit={16}
                            output="kpage"
                            pageName={`textbooks/${textbookData.id}`}
                        />
                    </div>
                    
                    <div className="inline-flex gap-3 w-full mt-2">
                        <Button type="submit" loading={loading} loadingText="Saving..."><Upload width={20} height={20}/> Save</Button>
                        <Button onClick={close} disabled={loading} variant="secondary"><CircleX width={20} height={20}/> Cancel</Button>
                    </div>
                </div>
            </form>
        </div>
    );
}