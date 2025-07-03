import type { Meta, StoryObj } from '@storybook/react';
import MeasurementForm from './growth-form';

const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const meta: Meta<typeof MeasurementForm> = {
	argTypes: {
		onClose: { action: 'closed' },
		onSave: { action: 'saved' },
		title: { control: 'text' },
	},
	component: MeasurementForm,
	parameters: {
		docs: {
			story: {
				height: '100vh',
				inline: false,
			},
		},
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Growth/MeasurementForm',
};

export default meta;
type Story = StoryObj<typeof MeasurementForm>;

export const AddMode: Story = {
	args: {
		onClose: () => {},
		onSave: () => {},
		title: 'Add New Growth Measurement',
	},
};

export const AddModeOnlyWeight: Story = {
	args: {
		...AddMode.args,
		title: 'Add Weight Measurement',
	},
};

export const EditMode: Story = {
	args: {
		measurement: {
			date: yesterday.toISOString(),
			headCircumference: 33.5,
			height: 49.0,
			id: 'growth-123',
			notes: 'Initial measurement',
			weight: 3100,
		},
		onClose: () => {},
		onSave: () => {},
		title: 'Edit Growth Measurement',
	},
};

export const ValidationNoMeasurementEntered: Story = {
	args: {
		...AddMode.args,
		title: 'Test Validation',
	},
};

export const ValidationPartialEntryThenSave: Story = {
	args: {
		...AddMode.args,
		title: 'Test Partial Save',
	},
};
