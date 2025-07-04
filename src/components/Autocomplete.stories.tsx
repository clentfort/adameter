import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { Autocomplete } from './autocomplete';

const meta = {
	args: { onOptionSelect: () => {}, onValueChange: () => {} },
	argTypes: {
		onOptionSelect: { action: 'onOptionSelect' },
		onValueChange: { action: 'onValueChange' },
	},
	component: Autocomplete,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Components/Autocomplete',
} satisfies Meta<typeof Autocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicUsage: Story = {
	args: {
		options: [
			{ id: '1', label: 'Apple' },
			{ id: '2', label: 'Banana' },
			{ id: '3', label: 'Cherry' },
			{ id: '4', label: 'Date' },
			{ id: '5', label: 'Elderberry' },
		],
		placeholder: 'Search for a fruit...',
		value: '',
	},
};

interface CustomOption {
	description: string;
	id: string;
	label: string;
}

export const WithCustomRenderOption: Story = {
	args: {
		options: [
			{ description: '250mg, every 8 hours', id: 'med1', label: 'Amoxicillin' },
			{
				description: '400mg, as needed for pain',
				id: 'med2',
				label: 'Ibuprofen',
			},
			{ description: '10mg, once daily', id: 'med3', label: 'Loratadine' },
		] as CustomOption[],
		placeholder: 'Search for medication...',
		renderOption: (option: CustomOption | { id: string; label: string }) => {
			// Type guard to handle both CustomOption and the base option type
			if ('description' in option) {
				return (
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<span style={{ fontWeight: 'bold' }}>{option.label}</span>
						<span style={{ color: 'gray', fontSize: '0.8em' }}>
							{option.description}
						</span>
					</div>
				);
			}
			// Default rendering for base option type
			return <div>{option.label}</div>;
		},
		value: '',
	},
};

export const AllowsArbitraryTextInput: Story = {
	args: {
		...BasicUsage.args,
		placeholder: 'Type anything...',
		value: 'This is not in the list',
	},
};

export const WithSelection: Story = {
	args: {
		...BasicUsage.args,
	},
};

const ControlledAutocomplete = (args: Story['args']) => {
	const [value, setValue] = React.useState(args?.value || '');

	React.useEffect(() => {
		setValue(args?.value || '');
	}, [args?.value]);

	const handleValueChange = (newValue: string) => {
		setValue(newValue);
		args?.onValueChange?.(newValue);
	};

	return (
		<Autocomplete {...args} onValueChange={handleValueChange} value={value} />
	);
};

export const ControlledState: Story = {
	args: {
		options: [
			{ id: 'ctrl1', label: 'Controlled Option 1' },
			{ id: 'ctrl2', label: 'Controlled Option 2' },
		],
		placeholder: 'Type to see controlled behavior...',
		value: 'Initial controlled text',
	},
	render: ControlledAutocomplete,
};

export const EmptyOptions: Story = {
	args: {
		options: [],
		placeholder: 'No options available...',
		value: '',
	},
};

export const EmptyOptionsWithInput: Story = {
	args: {
		options: [],
		placeholder: 'No options available...',
		value: 'User typed this',
	},
};

export const HidesWhenNoResultsAfterTyping: Story = {
	args: {
		options: [
			{ id: '1', label: 'Apple' },
			{ id: '2', label: 'Banana' },	
			{ id: '3', label: 'Cherry' },
		],
		placeholder: 'Search here...',
		value: '',
	},
};