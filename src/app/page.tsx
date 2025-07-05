'use client';

import { fbt } from 'fbtee';
import { format, Locale as DateFnsLocaleType } from 'date-fns';
import { de as deLocale, enUS as enUSLocale } from 'date-fns/locale'; // Static imports
import { useLocale } from '@/i18n/locale-context';
import React from 'react';

const dateLocales: Record<string, DateFnsLocaleType> = {
  de: deLocale,
  en: enUSLocale,
};

export default function HomePage() {
  const { locale, setLocale } = useLocale();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value as 'en' | 'de';
    setLocale(newLocale);
  };

  const currentDateFormatLocale = dateLocales[locale] || enUSLocale;

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">
          <fbt desc="Homepage main title">Minimal Next.js App</fbt>
        </h1>
      </header>

      <section className="mb-8">
        <p>
          <fbt desc="Static text example">
            This is a static internationalized text string.
          </fbt>
        </p>
        <p>
          <fbt desc="Current date label">Current date</fbt>: {format(new Date(), 'PPP', { locale: currentDateFormatLocale })}
        </p>
      </section>

      <section>
        <label htmlFor="language-select" className="mr-2">
          <fbt desc="Language selection label">Select Language</fbt>:
        </label>
        <select
          id="language-select"
          value={locale}
          onChange={handleLanguageChange}
          className="p-2 border rounded"
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
      </section>
    </div>
  );
}
