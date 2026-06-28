import { auth } from "@/lib/utils/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen flex flex-col">
      {children}
    </main>
  );
}
