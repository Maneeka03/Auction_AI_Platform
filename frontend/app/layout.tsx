import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/session-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auction AI Platform",
  description: "Auction AI Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}