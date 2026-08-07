import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/session-context";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "react-hot-toast";
const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      {/* <body>
        <AuthProvider>{children}</AuthProvider>
      </body> */}
      <body>
  <AuthProvider>
    {children}
  </AuthProvider>

 <Toaster
  position="top-right"
  toastOptions={{
    duration: 3000,
    style: {
      borderRadius: "12px",
      color: "#111827", // black text
      padding: "12px 16px",
      fontSize: "14px",
    },
    success: {
      style: {
        background: "#DCFCE7", // light green
        color: "#111827",      // black text
        border: "1px solid #86EFAC",
      },
      iconTheme: {
        primary: "#16A34A", // green check icon
        secondary: "#DCFCE7",
      },
    },
    error: {
      style: {
        background: "#FEE2E2", // light red
        color: "#111827",
        border: "1px solid #FCA5A5",
      },
      iconTheme: {
        primary: "#DC2626",
        secondary: "#FEE2E2",
      },
    },
  }}
/>
</body>
    </html>
  );
}