import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { KeyboardShortcutPanel } from "@/components/KeyboardShortcutPanel";
import { ChatProvider } from "@/context/ChatContext";
import { FloatingChatDrawer } from "@/components/FloatingChatDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixIt — Linux-First Error Diagnostic & Safe Fixes",
  description:
    "Paste programming or Linux errors, diagnose root causes, and get vetted, safe shell fixes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#070a12] text-zinc-100 font-sans">
        <ToastProvider>
          <ChatProvider>
            {children}
            <KeyboardShortcutPanel />
            <FloatingChatDrawer />
          </ChatProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
