import { de } from './de';
import { en } from './en';

export const translations = {
	de,
	en,
};

export type TranslationKey = keyof typeof de;
