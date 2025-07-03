import type { Meta, StoryObj } from '@storybook/react';
import StatsCard from './stats-card';

const meta: Meta<typeof StatsCard> = {
	argTypes: {
		children: { control: 'object' },
		title: { control: 'text' },
	},
	component: StatsCard,
	decorators: [
		(Story) => (
			<div style={{ width: '250px' }}>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Statistics/StatsCard',
};

export default meta;
type Story = StoryObj<typeof StatsCard>;

export const WithSimpleTextChild: Story = {
	args: {
		children: <p className="text-2xl font-bold">153</p>,
		title: 'Total Entries',
	},
};

export const WithMultipleChildren: Story = {
	args: {
		children: (
			<>
				<p className="text-2xl font-bold">25m 30s</p>
				<p className="text-xs text-muted-foreground">Based on 42 sessions</p>
			</>
		),
		title: 'Average Duration',
	},
};

export const WithLongTitle: Story = {
	args: {
		children: <p className="text-2xl font-bold">6.7</p>,
		title: 'Average Number of Diaper Changes Per Day Over The Last Month',
	},
};

export const NoChildren: Story = {
	args: {
		children: null,
		title: 'Awaiting Data',
	},
};
