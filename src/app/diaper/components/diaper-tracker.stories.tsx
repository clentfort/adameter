import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FbtContext, IntlVariations } from 'fbt';
// import { expect } from '@storybook/jest'; // Removed
import { vi } from 'vitest';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useLastUsedDiaperBrand } from '@/hooks/use-last-used-diaper-brand';
import { DIAPER_BRANDS } from '../utils/diaper-brands';
import DiaperTracker from './diaper-tracker';

// Mock the hooks using vi.mock
vi.mock('@/hooks/use-diaper-changes');
vi.mock('@/hooks/use-last-used-diaper-brand');

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

const mockAddDiaperChange = fn();
const currentMockLastUsedBrand = DIAPER_BRANDS[0].value;

// Store spies globally to ensure they are reset correctly
// No longer needed with jest.mock
// let useDiaperChangesSpy: jest.SpyInstance;
// let useLastUsedDiaperBrandSpy: jest.SpyInstance;

const meta: Meta<typeof DiaperTracker> = {
	argTypes: {
		// @ts-ignore : Storybook specific arg for controlling the mock
		mockedLastBrand: {
			control: 'select',
			options: DIAPER_BRANDS.map((b) => b.value),
		},
	},
	component: DiaperTracker,
	decorators: [
		(Story, context) => {
			mockAddDiaperChange.mockClear();

			// Configure the return values of the mocked hooks
			(useDiaperChanges as import('vitest').Mock).mockReturnValue({
				add: mockAddDiaperChange,
				remove: fn(),
				update: fn(),
				value: [],
			});

			(useLastUsedDiaperBrand as import('vitest').Mock).mockReturnValue(
				context.args.mockedLastBrand || currentMockLastUsedBrand,
			);

			return (
				<FbtContext.Provider value={fbtContextValue}>
					<Story />
				</FbtContext.Provider>
			);
		},
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Diaper/DiaperTracker',
};

export default meta;
type Story = StoryObj<typeof DiaperTracker & { mockedLastBrand?: string }>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const urineButton = canvas.getByRole('button', { name: /urine only/i });
		const stoolButton = canvas.getByRole('button', { name: /stool/i });

		await expect(urineButton).toBeInTheDocument();
		await expect(stoolButton).toBeInTheDocument();
	},
};

export const ClickUrineOpensDialog: Story = {
	args: {
		// @ts-ignore : Storybook specific arg for controlling the mock
		mockedLastBrand: DIAPER_BRANDS[1].value,
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const urineButton = canvas.getByRole('button', { name: /urine only/i });
		await userEvent.click(urineButton);

		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog'),
		);
		await expect(dialog).toBeVisible();
		const dialogTitle = within(dialog).getByText(/urine diaper - details/i);
		await expect(dialogTitle).toBeInTheDocument();

		const expectedBrandLabel = DIAPER_BRANDS.find(
			(b) => b.value === args.mockedLastBrand,
		)?.label;
		const diaperBrandSelect = within(dialog).getByRole('combobox'); // Shadcn select is a combobox
		await expect(diaperBrandSelect).toHaveTextContent(expectedBrandLabel || '');
	},
};

export const ClickStoolOpensDialog: Story = {
	args: {
		// @ts-ignore : Storybook specific arg for controlling the mock
		mockedLastBrand: DIAPER_BRANDS[2].value,
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const stoolButton = canvas.getByRole('button', { name: /stool/i });
		await userEvent.click(stoolButton);

		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog'),
		);
		await expect(dialog).toBeVisible();
		const dialogTitle = within(dialog).getByText(/stool diaper - details/i);
		await expect(dialogTitle).toBeInTheDocument();

		const expectedBrandLabel = DIAPER_BRANDS.find(
			(b) => b.value === args.mockedLastBrand,
		)?.label;
		const diaperBrandSelect = within(dialog).getByRole('combobox');
		await expect(diaperBrandSelect).toHaveTextContent(expectedBrandLabel || '');
	},
};

export const DialogSaveAction: Story = {
	play: async ({ canvasElement }) => {
		// mockAddDiaperChange is cleared in the decorator
		const canvas = within(canvasElement);
		const urineButton = canvas.getByRole('button', { name: /urine only/i });
		await userEvent.click(urineButton);

		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog'),
		);
		const saveButton = within(dialog).getByRole('button', { name: /save/i });

		await userEvent.click(saveButton);

		await waitFor(() => expect(mockAddDiaperChange).toHaveBeenCalledTimes(1));
		expect(mockAddDiaperChange).toHaveBeenCalledWith(
			expect.objectContaining({
				containsStool: false,
				id: expect.any(String),
				timestamp: expect.any(String),
			}),
		);

		await waitFor(() => expect(dialog).not.toBeVisible());
	},
};
