import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { EntityFormDialog } from './entity-form-dialog';

const meta: Meta<typeof EntityFormDialog> = {
	component: EntityFormDialog,
	title: 'Form/EntityFormDialog',
};

export default meta;

type Story = StoryObj<typeof EntityFormDialog>;

export const Default: Story = {
	render: (args) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const form = useForm({
			defaultValues: { name: '' },
		});
		return (
			<EntityFormDialog {...args} form={form}>
				<div className="py-4">Form Content Goes Here</div>
			</EntityFormDialog>
		);
	},
	args: {
		onClose: () => console.log('close'),
		onSave: (data) => console.log('save', data),
		title: 'Entity Form',
	},
};
