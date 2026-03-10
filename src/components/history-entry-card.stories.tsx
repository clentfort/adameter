import type { Meta, StoryObj } from '@storybook/react';
import { HistoryEntryCard } from './history-entry-card';

const meta: Meta<typeof HistoryEntryCard> = {
	argTypes: {
		onDelete: { action: 'deleted' },
		onEdit: { action: 'edited' },
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
	},
};

export const Diaper: Story = {
	args: {
		children: <p className="text-sm">Detailed notes about the change.</p>,
		className: 'border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20',
		formattedTime: '10:15 AM',
		title: (
			<div className="flex items-start gap-2">
				<div aria-hidden="true" className="shrink-0 mt-1" role="img">
					👶
				</div>
				<div className="text-yellow-800">
					<p>Urine & Stool</p>
				</div>
			</div>
		),
	},
};

export const Feeding: Story = {
	args: {
		children: (
			<div className="flex flex-col">
				<p>15 min</p>
				<p className="text-xs text-muted-foreground">
					Note: session crosses midnight
				</p>
			</div>
		),
		className: 'border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20',
		formattedTime: '2:30 PM',
		title: <p className="text-left-breast-dark font-medium">Left Breast</p>,
	},
};

export const Event: Story = {
	args: {
		children: (
			<div className="text-sm text-muted-foreground">
				<p>Doctor's appointment at the clinic.</p>
			</div>
		),
		className: 'border-border',
		formattedTime: '09:00 AM',
		title: 'Pediatrician Visit',
	},
};
