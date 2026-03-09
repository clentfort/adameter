import type { Meta, StoryObj } from '@storybook/react';
import { HistoryEntryCard } from './history-entry-card';

const meta: Meta<typeof HistoryEntryCard> = {
	argTypes: {
		onDelete: { action: 'deleted' },
		onEdit: { action: 'edited' },
		variant: {
			control: 'select',
			options: ['diaper', 'feeding', 'growth', 'teething', 'event'],
		},
	},
	component: HistoryEntryCard,
	title: 'Components/HistoryEntryCard',
};

export default meta;
type Story = StoryObj<typeof HistoryEntryCard>;

export const Default: Story = {
	args: {
		children: <p>Generic history entry content.</p>,
		formattedTime: '12:34 PM',
		variant: 'event',
	},
};

export const Diaper: Story = {
	args: {
		children: <p className="text-sm">Detailed notes about the change.</p>,
		emoji: '👶',
		formattedTime: '10:15 AM',
		title: (
			<div className="text-yellow-800">
				<p>Urine & Stool</p>
			</div>
		),
		variant: 'diaper',
	},
};

export const Feeding: Story = {
	args: {
		children: (
			<div className="flex flex-col">
				<p className="font-bold text-lg">15 min</p>
				<p className="text-xs text-muted-foreground">Note: session crosses midnight</p>
			</div>
		),
		formattedTime: '2:30 PM',
		title: <p className="text-left-breast-dark">Left Breast</p>,
		variant: 'feeding',
	},
};

export const Event: Story = {
	args: {
		children: (
			<div className="text-sm text-muted-foreground">
				<p>Doctor's appointment at the clinic.</p>
			</div>
		),
		formattedTime: '09:00 AM',
		title: 'Pediatrician Visit',
		variant: 'event',
	},
};

export const MultiEmojiDiaper: Story = {
	args: {
		children: <p className="text-sm">Potty training progress!</p>,
		emoji: (
			<div className="flex items-center gap-0.5">
				<span>👶</span>
				<span>🚽</span>
			</div>
		),
		formattedTime: '8:42 PM',
		title: (
			<div className="text-amber-700">
				<p>Urine</p>
				<p className="text-xs opacity-90">Potty: Stool</p>
			</div>
		),
		variant: 'diaper',
	},
};
