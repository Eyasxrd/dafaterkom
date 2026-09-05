import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'ar'];

export default getRequestConfig(async ({ requestLocale }) => {
  const resolvedLocale = await requestLocale;
  const locale = resolvedLocale && locales.includes(resolvedLocale) ? resolvedLocale : 'en';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});