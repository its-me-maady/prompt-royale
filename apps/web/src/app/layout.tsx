import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
