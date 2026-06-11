"use client";

import { Loader2 } from "lucide-react";

type LoadingOverlayProps = {
  message?: string;
};

export default function LoadingOverlay({
  message = "Loading...",
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-72 rounded-lg border border-gray-200 bg-white px-8 py-8 shadow-lg">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="text-[var(--isu-cardinal)] h-15 w-15 animate-spin" />

          <div className="text-center">
            <h2 className="text-xl font-semibold">{message}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
