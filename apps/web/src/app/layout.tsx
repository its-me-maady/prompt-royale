import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "PromptRoyale",
  description: "Gamified AI Study & Quiz Arena",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`min-h-screen bg-background font-sans antialiased ${inter.variable}`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-gray-900 focus:text-white">
          Skip to main content
        </a>
        <Header />
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
