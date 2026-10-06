// agent-notes: { ctx: "Root layout component with Header and Tailwind sans font stack", deps: ["./globals.css", "@/components/Header"], state: canonical, last: "dani@2026-09-20" }
import "./globals.css";
import Header from "@/components/Header";

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
      <body className="min-h-screen bg-background font-sans antialiased">
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
