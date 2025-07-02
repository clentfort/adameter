import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/react';
// import { expect } from '@storybook/jest'; // Removed
import { FbtContext, IntlVariations } from 'fbt';
import { Event } from '@/types/event';
import { GrowthMeasurement } from '@/types/growth';
import GrowthChart from './growth-chart';

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

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
	// Measurement with only weight
	{ date: createDate(45), id: 'gm5', weight: 5200 },
	// Measurement with only height
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
			<FbtContext.Provider value={fbtContextValue}>
				<div style={{ margin: 'auto', maxWidth: '800px' }}>
					{' '}
					{/* Allow more width for charts */}
					<Story />
				</div>
			</FbtContext.Provider>
		),
	],
	parameters: {
		layout: 'padded', // Charts might need more space
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
		// Check for sub-chart titles
		await expect(canvas.getByText('Weight (g)')).toBeInTheDocument();
		await expect(canvas.getByText('Height (cm)')).toBeInTheDocument();
		await expect(
			canvas.getByText('Head Circumference (cm)'),
		).toBeInTheDocument();
		// Check if the event note is present
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
		// Height and Head Circumference charts should show "No data available"
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
		// Event note should not be present
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
			// Gap of 60 days for weight/height
			{ date: createDate(0), height: 65, id: 'gm3', weight: 7200 },
			{ date: createDate(60), headCircumference: 36, id: 'gm_hc1' },
			{ date: createDate(30), headCircumference: 38, id: 'gm_hc2' },
		],
	},
	// Basic rendering check, actual chart line drawing is handled by LineChart component
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Growth Chart')).toBeInTheDocument();
	},
};

// Note: Detailed testing of the chart lines, points, and event markers
// would be part of the LineChart component's own stories and tests.
// These stories focus on the GrowthChart component's structure and data mapping.
