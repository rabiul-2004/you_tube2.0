import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { useState } from "react";
import Head from "next/head";
import { ThemeProvider } from "next-themes";

export default function App({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <UserProvider>
        <Head>
          <title>YourTube Clone</title>
        </Head>
        <div className="min-h-screen bg-background text-foreground">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <Toaster />
          <div className="flex min-w-0">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 min-w-0 max-w-full min-h-[calc(100vh-57px)] animate-fade-in safe-area-bottom">
              <Component {...pageProps} />
            </main>
          </div>
        </div>
      </UserProvider>
    </ThemeProvider>
  );
}
