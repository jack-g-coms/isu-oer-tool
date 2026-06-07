import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

import AuthProvider from "@/components/context/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dev - ISU OER Tool",
  description: "Dev - ISU OER Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <Toaster/>
          <main className="flex-1 mx-auto w-full max-w-6xl px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}