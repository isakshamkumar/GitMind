import "@/styles/globals.css";
import TopLoader from "@/components/top-loader";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: "GITMIND - AI-Powered Code Assistant",
  description: "GITMIND is an advanced AI IDE and code assistant that helps developers understand, collaborate, and build with their codebase. Alternative to Cursor and Windsurf, with GitHub integration and intelligent insights.",
  keywords: ["ai ide", "cursor alternative", "windsurf alternative", "ai code assistant", "github ai", "code intelligence", "repository analysis", "team collaboration"],
  openGraph: {
    title: "GITMIND - Revolutionize Your Coding Workflow",
    description: "Transform how you interact with your codebase using AI-powered tools and insights.",
    url: "https://gitmind.ai",
    siteName: "GITMIND",
    images: [
      {
        url: "/public/logo.png",
        width: 1200,
        height: 630,
        alt: "GITMIND Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GITMIND - AI-Powered Code Assistant",
    description: "Advanced AI tools for codebase understanding and collaboration.",
    images: ["/public/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TopLoader />
            <TRPCReactProvider>{children}</TRPCReactProvider>
            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
