import { vi } from 'vitest';

const fbtFunctionMock = vi.fn((templateOrParts, _description, _options) => {
    // If babel-plugin-fbtee passes a pre-formed template string (e.g., "{count} h"), return that.
    // If it passes array from source [fbt.param(), "str"], this will join them.
    // The fbt.param mock below ensures fbt.param() returns its value as a string.
    if (Array.isArray(templateOrParts)) {
        return templateOrParts.map(String).join('');
    }
    return String(templateOrParts);
});

(fbtFunctionMock as any).param = (_name: string, value: any) => String(value);
(fbtFunctionMock as any)._param = (value: any, _name?: string) => String(value); // Fallback for babel
(fbtFunctionMock as any)._ = fbtFunctionMock; // For JSX
(fbtFunctionMock as any).plural = (text: string, _count: any, _options?: any) => text;


export const fbt = fbtFunctionMock;
export const IntlVariations = { GENDER_UNKNOWN: 0, BOY: 1, GIRL: 2 };
export const setupFbtee = vi.fn();
export const GenderConst = { UNKNOWN: 0, MALE: 1, FEMALE: 2 };
export const FbtGenderConst = { UNKNOWN: 0, MALE: 1, FEMALE: 2 };
