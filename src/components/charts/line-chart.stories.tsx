import type { Meta, StoryObj } from '@storybook/react';
import LineChart from './line-chart';

const meta: Meta<typeof LineChart> = {
	argTypes: {
		backgroundColor: { control: 'color' },
		borderColor: { control: 'color' },
		data: { control: 'object' },
		datasetLabel: { control: 'text' },
		emptyStateMessage: { control: 'text' },
		events: { control: 'object' },
		title: { control: 'text' },
		xAxisLabel: { control: 'text' },
		yAxisLabel: { control: 'text' },
		yAxisUnit: { control: 'text' },
	},
	component: LineChart,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Components/Charts/LineChart',
};

export default meta;
type Story = StoryObj<typeof meta>;

const generateRandomData = (numPoints: number) => {
	const data = [];
	let value = 50;
	for (let i = 0; i < numPoints; i++) {
		const date = new Date();
		date.setDate(date.getDate() + i);
		value += Math.random() * 10 - 5;
		data.push({ x: date, y: Math.round(value * 100) / 100 });
	}
	return data;
};

export const Default: Story = {
	args: {
		data: generateRandomData(20),
		datasetLabel: 'Sample Data',
		emptyStateMessage: 'No data available to display.',
		title: 'Sample Line Chart',
		xAxisLabel: 'Date',
		yAxisLabel: 'Value',
		yAxisUnit: 'kg',
	},
};

export const Empty: Story = {
	args: {
		data: [],
		datasetLabel: 'Sample Data',
		emptyStateMessage: 'This is the empty state message.',
		title: 'Empty Line Chart',
		xAxisLabel: 'Date',
		yAxisLabel: 'Value',
		yAxisUnit: 'kg',
	},
};

export const WithEvents: Story = {
	args: {
		data: generateRandomData(30),
		datasetLabel: 'Weight',
		emptyStateMessage: 'No data available.',
		events: [
			{
				color: 'hsl(var(--primary))',
				endDate: (() => {
					const date = new Date();
					date.setDate(date.getDate() + 5);
					return date.toISOString();
				})(),
				id: 'event1',
				startDate: (() => {
					const date = new Date();
					date.setDate(date.getDate() + 5);
					return date.toISOString();
				})(),
				title: 'Vaccination',
				type: 'point',
			},
			{
				color: 'hsl(var(--destructive))',
				endDate: (() => {
					const date = new Date();
					date.setDate(date.getDate() + 15);
					return date.toISOString();
				})(),
				id: 'event2',
				startDate: (() => {
					const date = new Date();
					date.setDate(date.getDate() + 15);
					return date.toISOString();
				})(),
				title: 'Fever Spike',
				type: 'point',
			},
		],
		title: 'Weight Over Time with Events',
		xAxisLabel: 'Date',
		yAxisLabel: 'Weight',
		yAxisUnit: 'kg',
	},
};

export const CustomStyling: Story = {
	args: {
		backgroundColor: 'rgba(255, 99, 132, 0.2)',
		borderColor: 'rgb(255, 99, 132)',
		data: generateRandomData(15),
		datasetLabel: 'Custom Styled Data',
		emptyStateMessage: 'No data here.',
		title: 'Custom Styled Chart',
		xAxisLabel: 'Time',
		yAxisLabel: 'Measurement',
		yAxisUnit: 'cm',
	},
};

export const MultiplePointsSameDay: Story = {
	args: {
		data: [
			{ x: new Date(2024, 0, 1, 8, 0), y: 3.5 },
			{ x: new Date(2024, 0, 1, 12, 0), y: 3.52 },
			{ x: new Date(2024, 0, 1, 16, 0), y: 3.51 },
			{ x: new Date(2024, 0, 2, 9, 0), y: 3.55 },
			{ x: new Date(2024, 0, 2, 13, 0), y: 3.57 },
			{ x: new Date(2024, 0, 3, 10, 0), y: 3.6 },
		],
		datasetLabel: 'Intraday Measurements',
		emptyStateMessage: 'No data available.',
		title: 'Intraday Measurements Chart',
		xAxisLabel: 'Date & Time',
		yAxisLabel: 'Value',
		yAxisUnit: 'units',
	},
};

export const WithCustomTooltipFormatters: Story = {
	args: {
		data: generateRandomData(10),
		datasetLabel: 'Formatted Tooltip Data',
		emptyStateMessage: 'No data.',
		title: 'Chart with Custom Tooltips',
		tooltipLabelFormatter: (context: {
			dataset?: { label?: string };
			parsed: { y: unknown };
		}) => {
			return `Value: ${context.parsed.y} ${context.dataset?.label || ''}`;
		},
		tooltipTitleFormatter: (context) => {
			const date = new Date(context[0].parsed.x);
			return `Date: ${date.toLocaleDateString()}`;
		},
		xAxisLabel: 'X Axis',
		yAxisLabel: 'Y Axis',
		yAxisUnit: 'units',
	},
};
