import { auth } from "@/lib/utils/auth";
import { redirect } from "next/navigation";

export default async function FormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (session?.user) {
    redirect("/knowledge");
  }
  
  return (
    <main className="min-h-screen flex flex-col justify-center items-center">
      {children}
    </main>
  );
}
