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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      
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
      color: "var(--toast-text)",
      padding: "12px 16px",
      fontSize: "14px",
    },
    success: {
      style: {
        background: "var(--toast-success-bg)", color: "var(--toast-text)", border: "1px solid var(--toast-success-border)",
      },
      iconTheme: {
        primary: "#16A34A", // green check icon
        secondary: "var(--toast-success-bg)",
      },
    },
    error: {
      style: {
        background: "var(--toast-error-bg)", color: "var(--toast-text)", border: "1px solid var(--toast-error-border)",
      },
      iconTheme: {
        primary: "#DC2626",
        secondary: "var(--toast-error-bg)",
      },
    },
  }}
/>
</body>
    </html>
  );
}
