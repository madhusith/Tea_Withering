import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tea Withering Monitoring System | Kelani Valley Plantations",
  description:
    "Industrial IoT monitoring and decision-support system for high-elevation tea factories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
