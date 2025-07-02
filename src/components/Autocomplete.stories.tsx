import type { Meta, StoryObj } from '@storybook/react';
import React from 'react'; // Added React import
import { vi } from 'vitest'; // For action logging

import { Autocomplete } from './autocomplete';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
	component: Autocomplete,
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: 'centered',
	},
	title: 'Components/Autocomplete',
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	tags: ['autodocs'],
	// More on argTypes: https://storybook.js.org/docs/api/argtypes
	argTypes: {
		// Define argTypes for props if needed, for example, to control them in Storybook UI
		onOptionSelect: { action: 'onOptionSelect' },
		onValueChange: { action: 'onValueChange' },
	},
	// Use `fn` to spy on the onValueChange arg, which will appear in the actions panel once invoked
	args: { onOptionSelect: vi.fn(), onValueChange: vi.fn() },
} satisfies Meta<typeof Autocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
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
		// To demonstrate selection, we can pre-fill the value or let the user interact
		// Storybook actions will show onOptionSelect and onValueChange calls
	},
	play: async ({ args, canvasElement }) => {
		// This is an example of how to interact with the component in a story
		// For actual selection demonstration, user interaction in Storybook canvas is primary
		// You could simulate typing and clicking if needed with @storybook/testing-library
	},
};

// Story for controlled component
// We need a wrapper to manage state for this story
const ControlledAutocomplete = (args: Story['args']) => {
	const [value, setValue] = React.useState(args?.value || '');

	React.useEffect(() => {
		// Update internal state if args.value changes (e.g., from Storybook controls)
		setValue(args?.value || '');
	}, [args?.value]);

	const handleValueChange = (newValue: string) => {
		setValue(newValue);
		args?.onValueChange?.(newValue); // Call the mocked action
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
		value: 'Initial controlled text', // Initial value
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
