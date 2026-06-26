"use client"

import KnowledgeDocumentType from "@/lib/types/KnowledgeDocumentType";

import Input from "../input/Input";
import Dropdown from "../input/Dropdown";

type SearchHeaderProps = {
    search: string,
    setSearch: (state: string) => void,
    fileType: string,
    setFileType: (state: string) => void,
    docStatus?: string,
    setDocStatus?: (state: string) => void
    includeDocStatus?: boolean
}

export default function SearchHeader({
    search,
    setSearch,
    fileType,
    setFileType,
    includeDocStatus=true,
    ...props
}: SearchHeaderProps) {
    return (
        <div className={`grid grid-cols-1 ${includeDocStatus ? "lg:grid-cols-[6fr_1.5fr_1.5fr]" : "lg:grid-cols-[6fr_1.5fr]"} gap-2 rounded-lg border border-gray-200 bg-white py-2 px-2 shadow-lg`}>
            <Input
                value={search}
                search={true}
                onClear={() => setSearch("")}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
                placeholder="Search by title or class..."
            />

            <Dropdown
                options={[
                    {
                        label: "All document types",
                        value: ""
                    },
                    ...Object.values(KnowledgeDocumentType).map((value) => (
                        { label: (value as string), value: (value as string)  }
                    ))
                ]}
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                placeholder="All document types"
            />

            {includeDocStatus &&
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
                            label: "Processing",
                            value: "PROCESSING"
                        },
                        {
                            label: "Failed",
                            value: "FAILED"
                        },
                        {
                            label: "Ready",
                            value: "READY"
                        }
                    ]}
                    value={props.docStatus}
                    onChange={(e) => {
                        if (props.setDocStatus) {
                            props.setDocStatus(e.target.value)
                        }
                    }}
                    placeholder="All processing statuses"
                />
            }
        </div>
    );
}