import type { Meta, StoryObj } from '@storybook/react';
import { GrowthMeasurement } from '@/types/growth';
import GrowthMeasurementsList from './growth-list';

const now = new Date();
const createDate = (daysAgo: number): string => {
	const d = new Date(now);
	d.setDate(now.getDate() - daysAgo);
	return d.toISOString();
};

const sampleMeasurements: GrowthMeasurement[] = [
	{
		date: createDate(1),
		headCircumference: 34.2,
		height: 50.5,
		id: 'gm1',
		notes: 'Checkup 1',
		weight: 3500,
	},
	{
		date: createDate(7),
		headCircumference: 34.5,
		height: 51.0,
		id: 'gm2',
		notes: 'One week old',
		weight: 3650,
	},
	{
		date: createDate(30),
		headCircumference: 35.5,
		height: 53.5,
		id: 'gm3',
		notes: 'One month old',
		weight: 4200,
	},
	{ date: createDate(0), id: 'gm4', notes: 'Just weight today', weight: 3480 },
	{ date: createDate(2), headCircumference: 34.3, height: 50.8, id: 'gm5' },
];

const meta: Meta<typeof GrowthMeasurementsList> = {
	argTypes: {
		measurements: { control: 'object' },
		onMeasurementDelete: { action: 'deleted' },
		onMeasurementUpdate: { action: 'updated' },
	},
	component: GrowthMeasurementsList,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Growth/GrowthMeasurementsList',
};

export default meta;
type Story = StoryObj<typeof GrowthMeasurementsList>;

export const Default: Story = {
	args: {
		measurements: [...sampleMeasurements],
		onMeasurementDelete: () => {},
		onMeasurementUpdate: () => {},
	},
};

export const Empty: Story = {
	args: {
		measurements: [],
		onMeasurementDelete: () => {},
		onMeasurementUpdate: () => {},
	},
};

export const SingleMeasurementAllFields: Story = {
	args: {
		measurements: [sampleMeasurements[0]],
		onMeasurementDelete: () => {},
		onMeasurementUpdate: () => {},
	},
};

export const SingleMeasurementPartialFields: Story = {
	args: {
		measurements: [sampleMeasurements[3]],
		onMeasurementDelete: () => {},
		onMeasurementUpdate: () => {},
	},
};

export const DeleteMeasurementInteraction: Story = {
	args: {
		measurements: [sampleMeasurements[0], sampleMeasurements[1]],
		onMeasurementDelete: () => {},
		onMeasurementUpdate: () => {},
	},
};

export const EditMeasurementInteraction: Story = {
	args: {
		measurements: [sampleMeasurements[0]],
		onMeasurementDelete: () => {},
		onMeasurementUpdate: () => {},
	},
};

const sortedSampleMeasurementsForTest = () => {
	return [...sampleMeasurements].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);
};

export const CorrectSorting: Story = {
	args: {
		measurements: [
			sampleMeasurements[2],
			sampleMeasurements[0],
			sampleMeasurements[1],
		],
		onMeasurementDelete: () => {},
		onMeasurementUpdate: () => {},
	},
};
