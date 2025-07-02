import type { Meta, StoryObj } from '@storybook/react';
// import { expect } from '@storybook/jest'; // Removed
import { userEvent, within } from '@testing-library/react';
import { FbtContext, IntlVariations } from 'fbt';
import { DiaperChange } from '@/types/diaper';
import DiaperStats from './diaper-stats';

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

const today = new Date();
const createTimestamp = (
	daysAgo: number,
	hour: number = 12,
	minute: number = 0,
): string => {
	const d = new Date(today);
	d.setDate(today.getDate() - daysAgo);
	d.setHours(hour, minute, 0, 0);
	return d.toISOString();
};

const sampleDiaperChanges: DiaperChange[] = [
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'Pampers',
		id: 'dc1',
		leakage: false,
		timestamp: createTimestamp(0, 9),
	},
	{
		containsStool: true,
		containsUrine: true,
		diaperBrand: 'Pampers',
		id: 'dc2',
		leakage: false,
		timestamp: createTimestamp(0, 13),
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'Huggies',
		id: 'dc3',
		leakage: true,
		timestamp: createTimestamp(0, 17),
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'Pampers',
		id: 'dc4',
		leakage: false,
		timestamp: createTimestamp(1, 8),
	},
	{
		containsStool: true,
		containsUrine: true,
		diaperBrand: 'Luvs',
		id: 'dc5',
		leakage: false,
		timestamp: createTimestamp(1, 12),
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'Huggies',
		id: 'dc6',
		leakage: false,
		timestamp: createTimestamp(1, 16),
	},
	{
		containsStool: true,
		containsUrine: true,
		diaperBrand: 'Pampers',
		id: 'dc7',
		leakage: true,
		timestamp: createTimestamp(2, 9),
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'Luvs',
		id: 'dc8',
		leakage: false,
		timestamp: createTimestamp(2, 14),
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'Huggies',
		id: 'dc9',
		leakage: true,
		timestamp: createTimestamp(2, 18),
	},
	{
		containsStool: true,
		containsUrine: true,
		diaperBrand: 'Pampers',
		id: 'dc10',
		leakage: false,
		timestamp: createTimestamp(3, 10),
	},
	// Add more for robust brand/leakage stats
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'Pampers',
		id: 'dc11',
		leakage: false,
		timestamp: createTimestamp(0, 20),
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'Huggies',
		id: 'dc12',
		leakage: false,
		timestamp: createTimestamp(1, 20),
	},
	{
		containsStool: true,
		containsUrine: true,
		diaperBrand: 'Luvs',
		id: 'dc13',
		leakage: true,
		timestamp: createTimestamp(2, 20),
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperBrand: 'Pampers',
		id: 'dc14',
		leakage: false,
		timestamp: createTimestamp(3, 20),
	},
];

const meta: Meta<typeof DiaperStats> = {
	argTypes: {
		diaperChanges: { control: 'object' },
	},
	component: DiaperStats,
	decorators: [
		(Story) => (
			<FbtContext.Provider value={fbtContextValue}>
				<div style={{ margin: 'auto', maxWidth: '600px' }}>
					<Story />
				</div>
			</FbtContext.Provider>
		),
	],
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Statistics/DiaperStats',
};

export default meta;
type Story = StoryObj<typeof DiaperStats>;

export const DefaultView: Story = {
	args: {
		diaperChanges: sampleDiaperChanges,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		// Check for title
		await expect(canvas.getByText('Diaper Statistics')).toBeInTheDocument();
		// Check for default tab (Overview)
		await expect(
			canvas.getByRole('tab', { name: 'Overview', selected: true }),
		).toBeInTheDocument();
		// Check some overview stats (values depend on sampleDiaperChanges)
		// Total changes = 14
		// Days diff: today (day 0) to 3 days ago = 4 days. 14 / 4 = 3.5 per day
		await expect(canvas.getByText('14')).toBeInTheDocument(); // Total
		await expect(canvas.getByText('3.5')).toBeInTheDocument(); // Per Day
	},
};

export const EmptyState: Story = {
	args: {
		diaperChanges: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText('No diaper data available for the selected time range.'),
		).toBeInTheDocument();
	},
};

export const BrandsTab: Story = {
	args: {
		diaperChanges: sampleDiaperChanges,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const brandsTab = canvas.getByRole('tab', { name: 'Diaper Brands' });
		await userEvent.click(brandsTab);
		await expect(brandsTab).toHaveAttribute('aria-selected', 'true');
		// Check for some brand stats (Pampers: 6, Huggies: 4, Luvs: 3)
		await expect(canvas.getByText('Pampers')).toBeInTheDocument();
		await expect(canvas.getByText(/6 \(/i)).toBeInTheDocument(); // "6 (43%)"
		await expect(canvas.getByText('Huggies')).toBeInTheDocument();
		await expect(canvas.getByText(/4 \(/i)).toBeInTheDocument(); // "4 (29%)"
	},
};

export const LeakageTab: Story = {
	args: {
		diaperChanges: sampleDiaperChanges,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const leakageTab = canvas.getByRole('tab', { name: 'Diaper leaked' }); // Name from fbt string if exact
		await userEvent.click(leakageTab);
		await expect(leakageTab).toHaveAttribute('aria-selected', 'true');
		// Check for leakage stats.
		// Pampers: 1/6 = 17%
		// Huggies: 2/4 = 50%
		// Luvs: 1/3 = 33%
		// Only brands with >=3 uses: Pampers, Huggies, Luvs. Sorted by leakage % desc: Huggies, Luvs, Pampers.
		const pampersLeakage = await canvas.findByText((content, element) => {
			// Check if element is part of a leakage entry for Pampers
			const parentCard = element?.closest('.border.rounded-md.p-3');
			return (
				!!parentCard &&
				parentCard.textContent?.includes('Pampers') &&
				content.includes('17%')
			);
		});
		await expect(pampersLeakage).toBeInTheDocument();

		const huggiesLeakage = await canvas.findByText((content, element) => {
			const parentCard = element?.closest('.border.rounded-md.p-3');
			return (
				!!parentCard &&
				parentCard.textContent?.includes('Huggies') &&
				content.includes('50%')
			);
		});
		await expect(huggiesLeakage).toBeInTheDocument();

		const luvsLeakage = await canvas.findByText((content, element) => {
			const parentCard = element?.closest('.border.rounded-md.p-3');
			return (
				!!parentCard &&
				parentCard.textContent?.includes('Luvs') &&
				content.includes('33%')
			);
		});
		await expect(luvsLeakage).toBeInTheDocument();
	},
};

export const OnlyOneBrandRecorded: Story = {
	args: {
		diaperChanges: [
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'EcoNappies',
				id: 'dc1',
				leakage: false,
				timestamp: createTimestamp(0, 9),
			},
			{
				containsStool: true,
				containsUrine: true,
				diaperBrand: 'EcoNappies',
				id: 'dc2',
				leakage: true,
				timestamp: createTimestamp(0, 13),
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'EcoNappies',
				id: 'dc3',
				leakage: false,
				timestamp: createTimestamp(0, 17),
			},
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const brandsTab = canvas.getByRole('tab', { name: 'Diaper Brands' });
		await userEvent.click(brandsTab);
		await expect(canvas.getByText('EcoNappies')).toBeInTheDocument();
		await expect(canvas.getByText(/3 \(/i)).toBeInTheDocument(); // "3 (100%)"

		const leakageTab = canvas.getByRole('tab', { name: 'Diaper leaked' });
		await userEvent.click(leakageTab);
		const econappiesLeakage = await canvas.findByText((content, element) => {
			const parentCard = element?.closest('.border.rounded-md.p-3');
			return (
				!!parentCard &&
				parentCard.textContent?.includes('EcoNappies') &&
				content.includes('33%')
			);
		});
		await expect(econappiesLeakage).toBeInTheDocument();
	},
};

export const NotEnoughDataForLeakageStats: Story = {
	args: {
		diaperChanges: [
			// Only 2 uses for each brand
			{
				containsUrine: true,
				diaperBrand: 'BrandA',
				id: 'dc1',
				leakage: false,
				timestamp: createTimestamp(0, 9),
			},
			{
				containsUrine: true,
				diaperBrand: 'BrandA',
				id: 'dc2',
				leakage: true,
				timestamp: createTimestamp(0, 13),
			},
			{
				containsUrine: true,
				diaperBrand: 'BrandB',
				id: 'dc3',
				leakage: false,
				timestamp: createTimestamp(0, 17),
			},
			{
				containsUrine: true,
				diaperBrand: 'BrandB',
				id: 'dc4',
				leakage: false,
				timestamp: createTimestamp(1, 8),
			},
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const leakageTab = canvas.getByRole('tab', { name: 'Diaper leaked' });
		await userEvent.click(leakageTab);
		await expect(
			canvas.getByText('Not enough data for leakage statistics.'),
		).toBeInTheDocument();
	},
};
