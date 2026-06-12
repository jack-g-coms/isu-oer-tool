"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type PaginationProps = {
    page: number
    total: number
    limit: number
}

export default function Pagination({
    page,
    total,
    limit
}: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const totalPages = Math.ceil(total / limit);

    function changePage(newPage: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(newPage));
        router.push(`/knowledge?${params.toString()}`);
    }

    useEffect(() => {
        if (page > totalPages && page != 1) {
            changePage(1);
        }
    }, [page, totalPages]);

    if (totalPages <= 1) return null;

    return (
        <div className="
            mt-8
            flex
            flex-col
            gap-4
            border-t
            border-gray-200
            pt-4
            sm:flex-row
            sm:items-center
            sm:justify-between
        ">
            <p className="text-sm text-gray-500 text-center sm:text-left">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                    {(page - 1) * limit + 1}
                </span>
                {" "}-{" "}
                <span className="font-semibold text-gray-700">
                    {Math.min(page * limit, total)}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-gray-700">
                    {total}
                </span>
                {" "}documents
            </p>

            <div className="
                flex
                items-center
                justify-center
                gap-2
            ">
                <button
                    disabled={page === 1}
                    onClick={() => changePage(page - 1)}
                    className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-gray-200
                        cursor-pointer
                        bg-[var(--isu-cardinal)]
                        text-white
                        transition
                        hover:bg-[#A50D25]
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                    "
                >
                    <ChevronLeft size={18}/>
                </button>

                <div className="
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-gray-600
                    whitespace-nowrap
                ">
                    {page} / {totalPages}
                </div>

                <button
                    disabled={page === totalPages}
                    onClick={() => changePage(page + 1)}
                    className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-gray-200
                        cursor-pointer
                        bg-[var(--isu-cardinal)]
                        text-white
                        transition
                        hover:bg-[#A50D25]
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                    "
                >
                    <ChevronRight size={18}/>
                </button>
            </div>
        </div>
    );
}