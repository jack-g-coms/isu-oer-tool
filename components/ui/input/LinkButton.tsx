"use client";

import Link from "next/link";

type LinkButtonProps = {
  href: string
  active?: boolean
  children: React.ReactNode
};

export default function LinkButton({
  href,
  active = false,
  children,
}: LinkButtonProps) {
  const base =
    "flex flex-row gap-4 items-center px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2";

  const styles = active
    ? "bg-[var(--isu-cardinal)] text-white hover:bg-[#A50D25] active:bg-[#8C0B20] focus:ring-[var(--isu-cardinal)]"
    : "text-gray-500 hover:bg-gray-100 focus:ring-[var(--isu-cardinal)]";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}
