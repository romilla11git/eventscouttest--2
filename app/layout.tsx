import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ToastProvider } from "@/components/ToastProvider";
import PWARegistration from "@/components/PWARegistration";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
    title: "EventScout AI Command Center",
    description: "AI-powered intelligence system for discovering strategic business opportunities.",
    manifest: "/manifest.json"
};

export const viewport = {
    themeColor: "#0f172a"
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                />
            </head>
            <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased text-foreground bg-background`}>
                <PWARegistration />
                <ToastProvider>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}
