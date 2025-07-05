import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from './page';
import { LocaleProvider } from '@/i18n/locale-context';
import { I18nProvider } from 'fbtee'; // fbtee's own provider for fbt strings
import { de } from 'date-fns/locale/de';
import { enUS } from 'date-fns/locale/en-US';
import { format } from 'date-fns';

// Mock date-fns locales that are dynamically required in page.tsx
// Vitest/Jest can sometimes struggle with dynamic requires inside React components.
// Pre-importing them or ensuring they are available in the test environment is safer.
jest.mock('date-fns/locale/de', () => de);
jest.mock('date-fns/locale/en-US', () => enUS);

// Mock the i18n setup from fbtee to ensure translations are loaded for tests
// This assumes the translations are bundled with the app or available during tests.
// We'll use the actual translations by wrapping with I18nProvider
// and relying on the setup in src/i18n/index.ts which should be imported by LocaleProvider.

const mockDate = new Date(2023, 9, 26); // October 26, 2023 - Month is 0-indexed

describe('HomePage', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const TestApp = ({ children }: { children: React.ReactNode }) => (
    <LocaleProvider>
      {/*
        I18nProvider is fbtee's component that makes translations available.
        It typically takes the `translations` and `locale` from fbtee's setup.
        However, our useLocale from locale-context should handle providing the correct locale
        to fbtee's internals, and src/i18n/index.ts already calls setupFbtee.
        So direct use of I18nProvider here might be redundant if LocaleProvider correctly
        triggers fbtee's context. Let's try without it first, relying on LocaleProvider
        and the global fbtee setup. If fbt tags don't translate, we might need it.
      */}
      {children}
    </LocaleProvider>
  );

  test('renders initial content in English', () => {
    render(<HomePage />, { wrapper: TestApp });

    expect(screen.getByText('Minimal Next.js App')).toBeInTheDocument();
    expect(screen.getByText('This is a static internationalized text string.')).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.startsWith('Current date') && content.includes(format(mockDate, 'PPP', { locale: enUS })))).toBeInTheDocument();
    expect(screen.getByLabelText('Select Language:')).toHaveValue('en');
  });

  test('switches to German and updates content', () => {
    render(<HomePage />, { wrapper: TestApp });

    const languageSelect = screen.getByLabelText('Select Language:');
    fireEvent.change(languageSelect, { target: { value: 'de' } });

    expect(screen.getByText('Minimale Next.js App')).toBeInTheDocument();
    expect(screen.getByText('Dies ist ein statischer internationalisierter Textstring.')).toBeInTheDocument();
    // The label "Current date" itself should change
    expect(screen.getByText((content, element) => content.startsWith('Aktuelles Datum') && content.includes(format(mockDate, 'PPP', { locale: de })))).toBeInTheDocument();
    expect(languageSelect).toHaveValue('de');
  });

  test('switches back to English from German', () => {
    render(<HomePage />, { wrapper: TestApp });

    const languageSelect = screen.getByLabelText('Select Language:');

    // Switch to German first
    fireEvent.change(languageSelect, { target: { value: 'de' } });
    expect(screen.getByText('Minimale Next.js App')).toBeInTheDocument(); // Verify German
    expect(languageSelect).toHaveValue('de');

    // Switch back to English
    fireEvent.change(languageSelect, { target: { value: 'en' } });

    expect(screen.getByText('Minimal Next.js App')).toBeInTheDocument();
    expect(screen.getByText('This is a static internationalized text string.')).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.startsWith('Current date') && content.includes(format(mockDate, 'PPP', { locale: enUS })))).toBeInTheDocument();
    expect(languageSelect).toHaveValue('en');
  });
});
