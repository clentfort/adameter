import type { Meta, StoryObj } from '@storybook/react';
import { HistoryEntryCard } from './history-entry-card';

const meta: Meta<typeof HistoryEntryCard> = {
	component: HistoryEntryCard,
	tags: ['autodocs'],
	title: 'Components/HistoryEntryCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Diaper: Story = {
	args: {
		children: (
			<div className="mt-2 text-sm space-y-1">
				<p>Product: Luvs</p>
			</div>
		),
		emoji: '👶',
		formattedTime: '10:30 AM',
		onDelete: () => {},
		onEdit: () => {},
		title: 'Urine & Stool',
		variant: 'diaper',
	},
};

export const Feeding: Story = {
	args: {
		children: (
			<div className="text-right flex flex-col items-end">
				<p className="font-bold">15 min</p>
			</div>
		),
		formattedTime: '12:00 PM',
		onDelete: () => {},
		onEdit: () => {},
		title: 'Left Breast',
		variant: 'feeding',
	},
};

export const Growth: Story = {
	args: {
		children: (
			<div className="mt-2 space-y-1">
				<p className="text-sm">Weight: 4500 g</p>
				<p className="text-sm">Height: 55 cm</p>
			</div>
		),
		emoji: '📏',
		formattedTime: '02. April 2024',
		onDelete: () => {},
		onEdit: () => {},
		variant: 'growth',
	},
};

export const Teething: Story = {
	args: {
		children: (
			<div className="mt-2 space-y-1">
				<p className="text-sm">Upper Left Central (61)</p>
			</div>
		),
		emoji: '🦷',
		formattedTime: '05. April 2024',
		onDelete: () => {},
		onEdit: () => {},
		title: 'Tooth Erupted',
		variant: 'teething',
	},
};

export const Event: Story = {
	args: {
		children: (
			<div className="mt-1">
				<p className="text-sm text-muted-foreground">High temperature</p>
			</div>
		),
		onDelete: () => {},
		onEdit: () => {},
		style: { borderLeftColor: '#ef4444', borderLeftWidth: '4px' },
		title: 'Fever',
		variant: 'event',
	},
};
