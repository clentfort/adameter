import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/react';
import { Event } from '@/types/event';
import { GrowthMeasurement } from '@/types/growth';
import GrowthChart from './growth-chart';

const today = new Date();
const createDate = (daysAgo: number, hour: number = 12): string => {
	const d = new Date(today);
	d.setDate(today.getDate() - daysAgo);
	d.setHours(hour, 0, 0, 0);
	return d.toISOString();
};

const sampleMeasurements: GrowthMeasurement[] = [
	{
		date: createDate(90),
		headCircumference: 34,
		height: 50,
		id: 'gm1',
		weight: 3500,
	},
	{
		date: createDate(60),
		headCircumference: 36,
		height: 55,
		id: 'gm2',
		weight: 4800,
	},
	{
		date: createDate(30),
		headCircumference: 38,
		height: 60,
		id: 'gm3',
		weight: 5900,
	},
	{
		date: createDate(0),
		headCircumference: 40,
		height: 65,
		id: 'gm4',
		weight: 7200,
	},
	{ date: createDate(45), id: 'gm5', weight: 5200 },
	{ date: createDate(15), height: 62, id: 'gm6' },
];

const sampleEvents: Event[] = [
	{
		color: 'red',
		id: 'ev1',
		startDate: createDate(60),
		title: 'Vaccination #1',
		type: 'point',
	},
	{
		color: 'blue',
		id: 'ev2',
		startDate: createDate(30),
		title: 'Started Solids',
		type: 'point',
	},
];

const meta: Meta<typeof GrowthChart> = {
	argTypes: {
		events: { control: 'object' },
		measurements: { control: 'object' },
	},
	component: GrowthChart,
	decorators: [
		(Story) => (
			<div style={{ margin: 'auto', maxWidth: '800px' }}>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Statistics/GrowthChart',
};

export default meta;
type Story = StoryObj<typeof GrowthChart>;

export const DefaultView: Story = {
	args: {
		events: sampleEvents,
		measurements: sampleMeasurements,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Growth Chart')).toBeInTheDocument();
		await expect(canvas.getByText('Weight (g)')).toBeInTheDocument();
		await expect(canvas.getByText('Height (cm)')).toBeInTheDocument();
		await expect(
			canvas.getByText('Head Circumference (cm)'),
		).toBeInTheDocument();
		await expect(
			canvas.getByText(/vertical lines indicate important events/i),
		).toBeInTheDocument();
	},
};

export const NoMeasurements: Story = {
	args: {
		events: [],
		measurements: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(
				'No measurements available. Add measurements to see the growth chart.',
			),
		).toBeInTheDocument();
	},
};

export const OnlyWeightData: Story = {
	args: {
		events: [],
		measurements: [
			{ date: createDate(30), id: 'gmw1', weight: 5000 },
			{ date: createDate(0), id: 'gmw2', weight: 5500 },
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Weight (g)')).toBeInTheDocument();
		const heightChartArea = canvas.getByText('Height (cm)').closest('div');
		if (heightChartArea)
			await expect(
				within(heightChartArea).getByText('No data available.'),
			).toBeInTheDocument();

		const headCircChartArea = canvas
			.getByText('Head Circumference (cm)')
			.closest('div');
		if (headCircChartArea)
			await expect(
				within(headCircChartArea).getByText('No data available.'),
			).toBeInTheDocument();
	},
};

export const NoEvents: Story = {
	args: {
		events: [],
		measurements: sampleMeasurements,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.queryByText(/vertical lines indicate important events/i),
		).not.toBeInTheDocument();
	},
};

export const MeasurementsWithGaps: Story = {
	args: {
		events: [],
		measurements: [
			{ date: createDate(90), height: 50, id: 'gm1', weight: 3500 },
			{ date: createDate(0), height: 65, id: 'gm3', weight: 7200 },
			{ date: createDate(60), headCircumference: 36, id: 'gm_hc1' },
			{ date: createDate(30), headCircumference: 38, id: 'gm_hc2' },
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Growth Chart')).toBeInTheDocument();
	},
};
