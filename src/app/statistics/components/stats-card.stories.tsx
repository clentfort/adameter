import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/react';
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Total Entries')).toBeInTheDocument();
		await expect(canvas.getByText('153')).toBeInTheDocument();
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Average Duration')).toBeInTheDocument();
		await expect(canvas.getByText('25m 30s')).toBeInTheDocument();
		await expect(canvas.getByText('Based on 42 sessions')).toBeInTheDocument();
	},
};

export const WithLongTitle: Story = {
	args: {
		children: <p className="text-2xl font-bold">6.7</p>,
		title: 'Average Number of Diaper Changes Per Day Over The Last Month',
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(
				'Average Number of Diaper Changes Per Day Over The Last Month',
			),
		).toBeInTheDocument();
		await expect(canvas.getByText('6.7')).toBeInTheDocument();
	},
};

export const NoChildren: Story = {
	args: {
		children: null,
		title: 'Awaiting Data',
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Awaiting Data')).toBeInTheDocument();
		const cardContent = canvas
			.getByText('Awaiting Data')
			.closest('div')?.nextElementSibling;
		if (cardContent) {
			expect(cardContent.childElementCount).toBe(0);
		}
	},
};
