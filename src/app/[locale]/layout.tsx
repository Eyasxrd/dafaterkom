import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import ElectronInitializer from '@/components/ElectronInitializer';
import PWARegister from '@/components/PWARegister';
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const locales = ['en', 'ar'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL("https://dafaterkom.com"),
  title: {
    default: "Dafaterkom Cloud POS - Modern Café & Restaurant Point of Sale",
    template: "%s | Dafaterkom Cloud POS"
  },
  description: "Multi-tenant offline-first Point of Sale for Cafes & QSRs. Real-time LAN sync, Kitchen Display System (KDS), digital QR menu ordering, Apple Wallet loyalty passes, and inventory control.",
  applicationName: "Dafaterkom Cloud POS",
  keywords: [
    "POS",
    "Point of Sale",
    "Restaurant POS",
    "Cafe POS",
    "Kitchen Display System",
    "KDS",
    "Digital Menu",
    "QR Ordering",
    "Apple Wallet Loyalty",
    "Offline POS"
  ],
  authors: [{ name: "Dafaterkom Team", url: "https://dafaterkom.com" }],
  creator: "Dafaterkom",
  publisher: "Dafaterkom",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dafaterkom.com",
    title: "Dafaterkom Cloud POS - Modern Café & Restaurant Point of Sale",
    description: "Multi-tenant offline-first Point of Sale for Cafes & QSRs with real-time LAN sync, KDS, and Apple Wallet passes.",
    siteName: "Dafaterkom Cloud POS",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Dafaterkom Cloud POS"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "Dafaterkom Cloud POS",
    description: "Modern Café & Restaurant Point of Sale System",
    images: ["/icon.svg"]
  }
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Enable request locale caching for static and dynamic SSR consistency
  setRequestLocale(locale);

  const messages = await getMessages();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col relative" suppressHydrationWarning>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var d = localStorage.getItem('darkMode');
                if (d === 'true' || (d === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <div className="liquid-bg-mesh" aria-hidden="true" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ElectronInitializer />
          <PWARegister />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
