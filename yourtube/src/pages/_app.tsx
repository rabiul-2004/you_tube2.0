import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import OtpDialog from "@/components/OtpDialog";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { WatchPartyProvider } from "../lib/WatchPartyProvider";
import { useState } from "react";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UserProvider>
      <WatchPartyProvider>
        <Head>
          <title>YourTube Clone</title>
        </Head>
        <div className="min-h-screen bg-background text-foreground">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <OtpDialog />
          <Toaster />
          <div className="flex min-w-0">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 min-w-0 max-w-full min-h-[calc(100vh-57px)] animate-fade-in safe-area-bottom">
              <Component {...pageProps} />
            </main>
          </div>
        </div>
      </WatchPartyProvider>
    </UserProvider>
  );
}
