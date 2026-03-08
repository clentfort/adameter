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
		emoji: (
			<div className="flex flex-col items-center">
				<span>👶</span>
				<span>🚽</span>
			</div>
		),
		formattedTime: '10:30 AM',
		onDelete: () => {},
		onEdit: () => {},
		title: (
			<div className="flex flex-col">
				<span className="text-sm">Urine & Stool</span>
				<span className="text-xs opacity-90">Potty: Urine</span>
			</div>
		),
		variant: 'diaper',
	},
};

export const Feeding: Story = {
	args: {
		children: null,
		formattedTime: '12:00 PM',
		onDelete: () => {},
		onEdit: () => {},
		rightContent: <p className="font-bold">15 min</p>,
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
