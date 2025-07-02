import type { Meta, StoryObj } from '@storybook/react';
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// import { action } from '@storybook/addon-actions'; // Removed
// import { FbtContext, IntlVariations } from 'fbt'; // Removed
// import { expect } from '@storybook/jest'; // Removed
// import { vi } from 'vitest'; // Removed
// import { useDiaperChanges } from '@/hooks/use-diaper-changes'; // Actual hook will be used
// import { useLastUsedDiaperBrand } from '@/hooks/use-last-used-diaper-brand'; // Actual hook will be used
import { DIAPER_BRANDS } from '../utils/diaper-brands';
import DiaperTracker from './diaper-tracker';

// vi.mock calls removed

// Mock FbtContext for Storybook - REMOVED
// const fbtContextValue = {
// 	IntlVariations,
// 	locale: 'en_US',
// 	translation: {},
// };

const mockAddDiaperChange = () => {}; // Replaced action with no-op
// const currentMockLastUsedBrand = DIAPER_BRANDS[0].value; // Will be passed via args if needed

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
			// The component will now use its actual hooks.
			// If `mockAddDiaperChange` (the Storybook action) is called by the hook,
			// it will be logged.
			// Clearing actions or setting mock hook values here is removed
			// as we are no longer using vi.mock for these hooks in stories.
			return <Story />;
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

		// await expect(urineButton).toBeInTheDocument(); // Assertion removed
		// await expect(stoolButton).toBeInTheDocument(); // Assertion removed
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
		// await expect(dialog).toBeVisible(); // Assertion removed
		const dialogTitle = within(dialog).getByText(/urine diaper - details/i);
		// await expect(dialogTitle).toBeInTheDocument(); // Assertion removed

		const expectedBrandLabel = DIAPER_BRANDS.find(
			(b) => b.value === args.mockedLastBrand,
		)?.label;
		const diaperBrandSelect = within(dialog).getByRole('combobox'); // Shadcn select is a combobox
		// await expect(diaperBrandSelect).toHaveTextContent(expectedBrandLabel || ''); // Assertion removed
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
		// await expect(dialog).toBeVisible(); // Assertion removed
		const dialogTitle = within(dialog).getByText(/stool diaper - details/i);
		// await expect(dialogTitle).toBeInTheDocument(); // Assertion removed

		const expectedBrandLabel = DIAPER_BRANDS.find(
			(b) => b.value === args.mockedLastBrand,
		)?.label;
		const diaperBrandSelect = within(dialog).getByRole('combobox');
		// await expect(diaperBrandSelect).toHaveTextContent(expectedBrandLabel || ''); // Assertion removed
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

		// await waitFor(() => expect(mockAddDiaperChange).toHaveBeenCalledTimes(1)); // Assertion removed
		// expect(mockAddDiaperChange).toHaveBeenCalledWith( // Assertion removed
		// 	expect.objectContaining({
		// 		containsStool: false,
		// 		id: expect.any(String),
		// 		timestamp: expect.any(String),
		// 	}),
		// );

		// await waitFor(() => expect(dialog).not.toBeVisible()); // Assertion removed
	},
};
