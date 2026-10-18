import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { PWARegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "chartplus | تحلیل و ترید هوشمند بازار جهانی",
  description:
    "chartplus اپلیکیشن فارسی ترید و تحلیل بازارهای جهانی با هوش مصنوعی؛ قیمت زنده، چارت کندل‌استیک، تحلیل تکنیکال خودکار، آموزش مرحله‌ای و هشدار قیمت.",
  keywords: ["chartplus", "ترید", "تحلیل تکنیکال", "بیت‌کوین", "ارز دیجیتال", "هوش مصنوعی", "بورس", "فارکس"],
  authors: [{ name: "chartplus" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "chartplus — تحلیل و ترید هوشمند بازار جهانی",
    description: "قیمت زنده، تحلیل تکنیکال هوش مصنوعی، آموزش و هشدار قیمت — همه در یک اپ فارسی",
    siteName: "chartplus",
    type: "website",
  },
  applicationName: "chartplus",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "chartplus",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#040b16",
  viewportFit: "cover",
};

const themeInit = `
(function() {
  try {
    var t = localStorage.getItem('chartplus-theme') || 'dark';
    document.documentElement.classList.add(t === 'light' ? 'light' : 'dark');
    document.documentElement.style.colorScheme = t === 'light' ? 'light' : 'dark';
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="chartplus-theme">
          {children}
          <Toaster />
          <PWARegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
