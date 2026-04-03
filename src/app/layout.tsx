import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Recap",
  description: "Flashcard and MCQ study display for TV",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
