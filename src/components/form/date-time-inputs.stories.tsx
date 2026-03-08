import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { DateTimeInputs } from './date-time-inputs';

const meta: Meta<typeof DateTimeInputs> = {
	component: DateTimeInputs,
	title: 'Form/DateTimeInputs',
};

export default meta;

type Story = StoryObj<typeof DateTimeInputs>;

export const Default: Story = {
	render: (args) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const { register } = useForm({
			defaultValues: {
				date: '2023-01-01',
				time: '12:00',
			},
		});
		return <DateTimeInputs {...args} register={register as any} />;
	},
};

export const WithTime: Story = {
	...Default,
	args: {
		dateField: 'date',
		timeField: 'time',
	},
};

export const DateOnly: Story = {
	...Default,
	args: {
		dateField: 'date',
	},
};
