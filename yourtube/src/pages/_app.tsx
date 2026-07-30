import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { useState } from "react";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UserProvider>
      <Head>
        <title>YourTube Clone</title>
      </Head>
      <div className="min-h-screen bg-white text-black">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Toaster />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 min-h-[calc(100vh-56px)] animate-fade-in">
            <Component {...pageProps} />
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
