import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { FbtContext, IntlVariations } from 'fbt'; // Assuming these are the correct imports

import { DiaperChange } from '@/types/diaper';
import { DIAPER_BRANDS } from '../utils/diaper-brands';
import DiaperHistoryList from './diaper-history-list';

// Mock useDiaperChanges hook
const mockUseDiaperChanges = (changes: DiaperChange[]) => ({
	add: fn((change: DiaperChange) => changes.push(change)),
	remove: fn((id: string) => {
		const index = changes.findIndex((c) => c.id === id);
		if (index > -1) changes.splice(index, 1);
	}),
	update: fn((updatedChange: DiaperChange) => {
		const index = changes.findIndex((c) => c.id === updatedChange.id);
		if (index > -1) changes[index] = updatedChange;
	}),
	value: changes,
});

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

const now = new Date();
const anHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const sampleDiaperChanges: DiaperChange[] = [
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: DIAPER_BRANDS[0].value,
		id: '1',
		temperature: 36.8,
		timestamp: now.toISOString(),
	},
	{
		abnormalities: 'Slightly reddish',
		containsStool: true,
		containsUrine: true,
		diaperBrand: DIAPER_BRANDS[1].value,
		id: '2',
		leakage: true,
		timestamp: anHourAgo.toISOString(),
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'andere', // Custom brand
		id: '3',
		temperature: 38.2, // Abnormal
		timestamp: threeHoursAgo.toISOString(),
	},
	{
		abnormalities: 'Normal stool, but a lot of it.',
		containsStool: true,
		containsUrine: true,
		id: '4',
		timestamp: yesterday.toISOString(),
	},
];

const meta: Meta<typeof DiaperHistoryList> = {
	component: DiaperHistoryList,
	decorators: [
		(Story, { args }) => (
			<FbtContext.Provider value={fbtContextValue}>
				<Story
					args={{
						...args,
						// Pass the mocked data directly to the new prop
						diaperChangesData: mockUseDiaperChanges(args.mockChanges || []),
					}}
				/>
			</FbtContext.Provider>
		),
	],
	parameters: {
		layout: 'fullscreen', // Or 'padded' depending on how you want to display it
	},
	tags: ['autodocs'],
	title: 'App/Diaper/DiaperHistoryList',
	// We will pass mockChanges via args to control the data for each story
	// This 'mockChanges' arg is for Storybook controls to generate 'diaperChangesData'
	argTypes: {
		diaperChangesData: { table: { disable: true } }, // Hide diaperChangesData from Storybook controls
		mockChanges: { control: 'object' },
	},
};

export default meta;
// Adjust StoryObj type if 'mockChanges' is not a direct prop of DiaperHistoryList
type Story = StoryObj<
	typeof DiaperHistoryList & { mockChanges?: DiaperChange[] }
>;

export const Default: Story = {
	args: {
		mockChanges: [...sampleDiaperChanges],
	},
};

export const Empty: Story = {
	args: {
		mockChanges: [],
	},
};

export const SingleEntry: Story = {
	args: {
		mockChanges: [
			{
				abnormalities: 'Everything seems normal.',
				containsStool: false,
				containsUrine: true,
				diaperBrand: DIAPER_BRANDS[2].value,
				id: 'single-1',
				leakage: false,
				temperature: 37.0,
				timestamp: now.toISOString(),
			},
		],
	},
};

export const WithVariousDetails: Story = {
	args: {
		mockChanges: [
			{
				containsStool: false,
				containsUrine: true,
				id: 'vd1',
				timestamp: now.toISOString(),
			},
			{
				containsStool: true,
				containsUrine: true,
				diaperBrand: DIAPER_BRANDS[0].value,
				id: 'vd2',
				timestamp: anHourAgo.toISOString(),
			},
			{
				containsStool: false,
				containsUrine: true,
				id: 'vd3',
				temperature: 37.5,
				timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
			},
			{
				containsStool: false,
				containsUrine: true,
				id: 'vd4',
				leakage: true,
				timestamp: threeHoursAgo.toISOString(),
			},
			{
				abnormalities: 'Very yellow',
				containsStool: false,
				containsUrine: true,
				id: 'vd5',
				timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
			},
			{
				abnormalities: 'Rash',
				containsStool: true,
				containsUrine: true,
				diaperBrand: DIAPER_BRANDS[1].value,
				id: 'vd6',
				leakage: true,
				temperature: 36.0,
				timestamp: yesterday.toISOString(),
			},
		],
	},
};

// Note: Testing interactions like clicking edit/delete buttons to open dialogs
// would typically involve Storybook's `play` function and mocking the dialog components
// or their trigger mechanisms. These stories focus on rendering the list with data.
// The DiaperForm and DeleteEntryDialog themselves have their own stories for detailed states.

// To make this fully work, the DiaperHistoryList component would need to be refactored
// to accept the `useDiaperChanges` hook's return value as a prop, or use a dependency injection pattern
// that can be easily controlled in Storybook. For now, the decorator approach with args.mockChanges
// is a common way to handle this. If direct prop injection for the hook's state/functions isn't feasible,
// you might need to use Storybook's `moduleName` mocking for `@/hooks/use-diaper-changes`.
// For simplicity, this example assumes you can pass `mockChanges` and the decorator sets up the mock.

// A more robust mocking approach for the hook if not passing as prop:
// parameters: {
//   msw: {
//     handlers: {
//       // This depends on how useDiaperChanges fetches data if it were async.
//       // For Valtio/Yjs, it's usually synchronous after setup.
//     }
//   },
//   moduleMock: {
//     '@/hooks/use-diaper-changes': (storyArgs) => {
//        // storyArgs would allow access to args.mockChanges if needed
//        return {
//          useDiaperChanges: () => mockUseDiaperChanges(storyArgs.mockChanges || defaultMockData)
//        };
//     }
//   }
// }
// This would require Storybook setup for module mocking.
// The current decorator approach is simpler if it works for this component structure.
// The @ts-ignore comments are due to adding a non-standard prop 'mockChanges' for Storybook control.
// A cleaner way might involve a wrapper component or more advanced Storybook features.
