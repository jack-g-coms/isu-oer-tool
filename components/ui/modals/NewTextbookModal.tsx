"use client";

import { useState, useEffect } from "react";
import { useModalStore } from "@/components/stores/Modals";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import type { KnowledgeDocument } from "@/prisma/client";

import { textbookStatusBadgeColors, textbookStatusBadgeTextColors } from "@/lib/constants/textbookColors";
import { CircleX, Plus, GraduationCap, Brain } from "lucide-react";
import Input from "../input/Input";
import TextArea from "../input/TextArea";
import Button from "../input/Button";
import { createTextbook } from "@/lib/api/textbooks";
import SearchHeader from "../knowledge/SearchHeader";
import Grid from "../knowledge/Grid";
import Pagination from "../input/Pagination";

type NewTextbookModalProps = {
    data: KnowledgeDocument[],
    page: number,
    total: number
}

export default function NewTextbookModal({
    data,
    page,
    total
}: NewTextbookModalProps) {
    const searchParams = useSearchParams();
    const params = new URLSearchParams(searchParams);

    const router = useRouter();

    const [title, setTitle] = useState("");
    const [className, setClassName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [fileType, setFileType] = useState("");

    const [selections, setSelections] = useState<Record<string, boolean>>({});

    const close = useModalStore((state) => state.close);

    useEffect(() => {
        const trimmed = search.trim();
        const timeout = setTimeout(() => {
            if (trimmed.length != 0) {
                params.set("kq", trimmed);
            } else {
                params.delete("kq");
            }
            router.push(`/textbooks?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (fileType != "") {
            params.set("ktype", fileType);
        } else {
            params.delete("ktype");
        }

        router.push(`/textbooks?${params.toString()}`);
    }, [fileType])

    useEffect(() => {
        return () => {
            params.delete("kq");
            params.delete("ktype");
            params.delete("kpage");
            router.push(`/textbooks?${params.toString()}`); 
            router.refresh();
        };
    }, []);

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        if (loading) return;

        const sourceIds = Object.keys(selections);
        if (sourceIds.length == 0) {
            toast.error("You must select at least one source.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("class", className.length == 0 ? "None" : className);
        formData.append("description", description);
        for (const sourceId of sourceIds) {
            formData.append("sources", sourceId);
        }

        try {
            const textbook = await createTextbook(formData);
            close();
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

    function onSelect(doc: KnowledgeDocument) {
        setSelections((old) => {
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
        <div className="w-full h-screen md:max-h-[calc(100vh-4rem)] md:w-4xl md:rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-full py-6 px-6 space-y-6">
                <div className="space-y-2">
                    <div className="inline-flex gap-2">
                        <GraduationCap width={30} height={30}/>
                        <h1 className="text-2xl font-bold">New Textbook</h1>
                    </div>
                    <h3 className="text-md">Select your sources and let AI generate a structured textbook.</h3>
                </div>

                <Input
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your textbook"
                    required
                    tip='The more descriptive, the better the results.'
                />

                <Input
                    label="Class"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Enter the class this textbook is for or leave this field blank"
                    tip='If you leave this field blank, the class will be listed as "None"'
                />

                <TextArea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a descriptive description for your textbook"
                    tip='The more descriptive, the better the results.'
                    required
                />

                <hr className="border-0.5 border-gray-200 my-8"/>

                <div className="space-y-2">
                    <div className="inline-flex gap-2">
                        <Brain width={30} height={30}/>
                        <h1 className="text-2xl font-bold">Textbook Sources</h1>
                    </div>
                    <h3 className="text-md">Select the documents from your Knowledge Base that should be used by the AI in creating this textbook.</h3>
                    <p title="Selections" className={`text-sm p-1.5 w-fit tracking-tight rounded-xl font-semibold ${textbookStatusBadgeColors["QUEUED"]} ${textbookStatusBadgeTextColors["QUEUED"]}`} >
                        Sources: {Object.entries(selections).length}
                    </p>
                </div>

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
                    selections={selections}
                    onSelect={onSelect}
                />

                <Pagination
                    page={page}
                    total={total}
                    limit={16}
                    output="kpage"
                    pageName="textbooks"
                />
                
                <div className="inline-flex gap-3 w-full mt-2">
                    <Button type="submit" loading={loading} disabled={Object.keys(selections).length == 0} loadingText="Creating..."><Plus width={20} height={20}/> Create</Button>
                    <Button onClick={close} disabled={loading} variant="secondary"><CircleX width={20} height={20}/> Cancel</Button>
                </div>
            </form>
        </div>
    );
}