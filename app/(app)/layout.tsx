import NavigationBar from "@/components/ui/layout/NavigationBar";
import AuthLoader from "@/components/ui/layout/AuthLoader";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      <AuthLoader requiredStatus="authenticated" fallbackRoute="/">
        <NavigationBar/>
        <div className="mx-auto w-full max-w-8xl px-10 py-8">
          {children}
        </div>
      </AuthLoader>
    </main>
  );
}
