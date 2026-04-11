import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Recap",
  description: "Flashcard and MCQ study display for TV",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f17" },
  ],
};

// Inline script to apply stored theme before first paint (prevents flash).
const themeScript = [
  "(function(){",
  "try{",
  'var t=localStorage.getItem("study-recap:theme");',
  'if(t==="dark"||t==="light"){',
  'document.documentElement.setAttribute("data-theme",t)',
  "}else if(window.matchMedia&&",
  'window.matchMedia("(prefers-color-scheme:dark)").matches){',
  'document.documentElement.setAttribute("data-theme","dark")',
  "}",
  "}catch(e){}",
  "})()",
].join("");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
