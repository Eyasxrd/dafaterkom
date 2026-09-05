import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import ElectronInitializer from '@/components/ElectronInitializer';
import PWARegister from '@/components/PWARegister';
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

export const metadata: Metadata = {
  metadataBase: new URL("https://dafaterkom.com"),
  title: "Dafaterkom Cloud POS",
  description: "Multi-tenant offline-first Point of Sale for Cafes & QSRs",
  manifest: "/manifest.json"
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

  const messages = await getMessages();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
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
      </head>
      <body className="min-h-full flex flex-col relative" suppressHydrationWarning>
        <div className="liquid-bg-mesh" aria-hidden="true" />
        <NextIntlClientProvider messages={messages}>
          <ElectronInitializer />
          <PWARegister />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
