import type { Meta, StoryObj } from '@storybook/react';
import { DiaperChange } from '@/types/diaper';
import DiaperStats from './diaper-stats';

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
			<div style={{ margin: 'auto', maxWidth: '600px' }}>
				<Story />
			</div>
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
};

export const EmptyState: Story = {
	args: {
		diaperChanges: [],
	},
};

export const BrandsTab: Story = {
	args: {
		diaperChanges: sampleDiaperChanges,
	},
};

export const LeakageTab: Story = {
	args: {
		diaperChanges: sampleDiaperChanges,
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
};

export const NotEnoughDataForLeakageStats: Story = {
	args: {
		diaperChanges: [
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'BrandA',
				id: 'dc1',
				leakage: false,
				timestamp: createTimestamp(0, 9),
			},
			{
				containsStool: true,
				containsUrine: true,
				diaperBrand: 'BrandA',
				id: 'dc2',
				leakage: true,
				timestamp: createTimestamp(0, 13),
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'BrandB',
				id: 'dc3',
				leakage: false,
				timestamp: createTimestamp(0, 17),
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperBrand: 'BrandB',
				id: 'dc4',
				leakage: false,
				timestamp: createTimestamp(1, 8),
			},
		],
	},
};
