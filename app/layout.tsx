import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Midea AI Content Demo",
  description: "Local AI product marketing content workbench"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

