import AuthLoader from "@/components/ui/layout/AuthLoader";

export default function FormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center">
      <AuthLoader requiredStatus="unauthenticated" fallbackRoute="/dashboard">
        {children}
      </AuthLoader>
    </main>
  );
}
