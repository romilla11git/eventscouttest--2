import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
    title: "EventScout Command Centre | Elite Intelligence Hub",
    description: "AI-driven intelligence · Strategic foresight for iWorth · Real-time signal prioritization",
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
                <ToastProvider>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}
