import type { Preview } from '@storybook/nextjs';
import React from 'react';
// Attempt to use the application's LocaleProvider and useLocale hook
// This assumes that src/i18n/locale-context.ts is correctly set up and exports these.
import { LocaleProvider, useLocale } from '../src/i18n/locale-context';
import '../src/app/globals.css'; // Path to global CSS

// This component will allow Storybook to demonstrate locale switching via the app's context.
// Note: Actual translations in Storybook might require additional setup if not covered by fbtee's build process for stories.
const StorybookLocaleHandler = ({ children }: { children: React.ReactNode }) => {
  const { locale, setLocale } = useLocale();

  // Simple selector for Storybook to change language.
  // This relies on the app's `LocaleProvider` to correctly update and re-render.
  return (
    <div>
      <div style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #eee' }}>
        <span>Storybook Language: </span>
        <select value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'de')}>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
      {children}
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/, // Adjusted for typical Date prop names
      },
    },
  },
  decorators: [
    (Story) => (
      <LocaleProvider> {/* Use the application's LocaleProvider */}
        <StorybookLocaleHandler>
          <Story />
        </StorybookLocaleHandler>
      </LocaleProvider>
    ),
  ],
};

export default preview;
