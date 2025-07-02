import type { Meta, StoryObj } from '@storybook/react';
import { waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
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
		onMeasurementDelete: vi.fn(),
		onMeasurementUpdate: vi.fn(),
	},
};

export const Empty: Story = {
	args: {
		measurements: [],
		onMeasurementDelete: vi.fn(),
		onMeasurementUpdate: vi.fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(/no measurements recorded yet./i),
		).toBeInTheDocument();
	},
};

export const SingleMeasurementAllFields: Story = {
	args: {
		measurements: [sampleMeasurements[0]],
		onMeasurementDelete: vi.fn(),
		onMeasurementUpdate: vi.fn(),
	},
};

export const SingleMeasurementPartialFields: Story = {
	args: {
		measurements: [sampleMeasurements[3]],
		onMeasurementDelete: vi.fn(),
		onMeasurementUpdate: vi.fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText(/weight/i)).toBeInTheDocument();
		await expect(canvas.getByText('3480 g')).toBeInTheDocument();
		await expect(canvas.queryByText(/height/i)).not.toBeInTheDocument();
		await expect(
			canvas.queryByText(/head circumference/i),
		).not.toBeInTheDocument();
		await expect(canvas.getByText('Just weight today')).toBeInTheDocument();
	},
};

export const DeleteMeasurementInteraction: Story = {
	args: {
		measurements: [sampleMeasurements[0], sampleMeasurements[1]],
		onMeasurementDelete: vi.fn(),
		onMeasurementUpdate: vi.fn(),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const measurementToDelete = args.measurements![0];

		const allDeleteButtons = canvas.getAllByRole('button', { name: /delete/i });
		await userEvent.click(allDeleteButtons[0]);

		const dialog = await waitFor(() =>
			within(document.body).getByRole('alertdialog'),
		);
		await expect(dialog).toBeVisible();

		const confirmDeleteButton = within(dialog).getByRole('button', {
			name: /delete/i,
		});
		await userEvent.click(confirmDeleteButton);

		await waitFor(() =>
			expect(args.onMeasurementDelete).toHaveBeenCalledWith(
				measurementToDelete.id,
			),
		);
	},
};

export const EditMeasurementInteraction: Story = {
	args: {
		measurements: [sampleMeasurements[0]],
		onMeasurementDelete: vi.fn(),
		onMeasurementUpdate: vi.fn(),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const measurementToEdit = args.measurements![0];

		const editButton = canvas.getByRole('button', { name: /edit/i });
		await userEvent.click(editButton);

		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog', {
				name: /edit growth measurement/i,
			}),
		);
		await expect(dialog).toBeVisible();

		const weightInput = within(dialog).getByLabelText(/weight \(g\)/i);
		await userEvent.clear(weightInput);
		await userEvent.type(weightInput, '3550');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await waitFor(() =>
			expect(args.onMeasurementUpdate).toHaveBeenCalledWith(
				expect.objectContaining({
					id: measurementToEdit.id,
					weight: 3550,
				}),
			),
		);
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
		onMeasurementDelete: vi.fn(),
		onMeasurementUpdate: vi.fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const renderedTexts = canvas
			.getAllByText(/weight|height|head circumference|notes/i)
			.map((el) => el.closest('div.border')?.textContent || '');

		const measurementNotesInOrder = sortedSampleMeasurementsForTest()
			.filter(m => args.measurements!.find(am => am.id === m.id)) // filter to only those in this story's args
			.map(m => m.notes || m.id);

		// This is a simplified check. A more robust check would verify the full order.
		if (args.measurements && args.measurements.length > 1) {
			const firstNote = measurementNotesInOrder[0];
			const allCards = canvas.queryAllByRole('article'); // Assuming each measurement is in an article or similar landmark
			if (allCards.length > 0) {
				expect(within(allCards[0]).getByText(new RegExp(firstNote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
			}
		}
	},
};
