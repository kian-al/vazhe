import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/vazirmatn";
import "@fontsource-variable/fraunces/full.css";
import "./globals.css";
import { themeCss, DEFAULT_THEME, themes } from "@/design/tokens";
import { AppProvider } from "@/components/store";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: { default: "واژه — یادگیری واژگان انگلیسی", template: "%s · واژه" },
  description: "یادگیری آرام و پیوستهٔ واژه‌های انگلیسی با توضیح فارسی؛ جست‌وجو، صف، مطالعهٔ آزاد و کتابخانه.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: themes[DEFAULT_THEME].vars.surface,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme={DEFAULT_THEME}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body className="vz">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
