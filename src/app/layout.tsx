import "@/styles/globals.css";

import {
  ClerkProvider
} from '@clerk/nextjs'

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme-provider";
import KBar from "@/components/kbar";
import {Toaster} from "sonner"

export const metadata: Metadata = {
	title: "Synapse",
	description: "AI powered email client",
	icons: [{ rel: "icon", url: "icon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
        <ClerkProvider>
            <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
                <body className="overflow-hidden">
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <TRPCReactProvider>
                            <KBar>
                                {children}
                                <Toaster />
                            </KBar>
                        </TRPCReactProvider>
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
	);
}
