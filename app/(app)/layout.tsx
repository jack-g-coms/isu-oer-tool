import { auth } from "@/lib/utils/auth";
import { redirect } from "next/navigation";

import NavigationBar from "@/components/ui/layout/NavigationBar";
import ModalDisplay from "@/components/ui/overlays/ModalDisplay";

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
    <main className="min-h-screen flex flex-col lg:flex-row">
      <NavigationBar/>
      <div className="mx-auto w-full max-w-8xl px-6 lg:px-10 py-8">
        {children}
      </div>

      <ModalDisplay/>
    </main>
  );
}
