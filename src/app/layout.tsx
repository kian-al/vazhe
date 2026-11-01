import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppFrame } from "@/components/AppFrame";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "واژه — یادگیری واژگان انگلیسی",
  description: "یادگیری آرام و پیوستهٔ واژه‌های انگلیسی، با توضیح فارسی.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f8f3",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme="grove">
      <body>
        <Providers><AppFrame>{children}</AppFrame></Providers>
      </body>
    </html>
  );
}