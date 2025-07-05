import type { Meta, StoryObj } from '@storybook/react';
import { MedicationRegimen } from '@/types/medication-regimen';
import {
	DueMedicationsDisplay,
} from './due-medications-display';

// No vi.mock for the hook here. Story will use the actual hook.
// Types related to the hook's return value are also removed from here
// as we are not creating mock data for it in this simplified version.

const meta: Meta<typeof DueMedicationsDisplay> = {
	args: {
		onSelectDueMedication: (data) => {
			console.log('onSelectDueMedication called with:', data);
			// In a real Storybook environment with addon-actions, you might use:
			// import { action } from '@storybook/addon-actions';
			// onSelectDueMedication: action('onSelectDueMedication'),
			// But given potential issues with addon resolution and vi limitations,
			// a simple console.log is the safest for now.
		},
	},
	component: DueMedicationsDisplay,
	decorators: [
		(Story) => (
			<div style={{ maxWidth: '600px', padding: '20px', width: '100vw' }}>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Medication/DueMedicationsDisplay',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Since we cannot reliably mock the hook's different return values without vi
// in the Storybook environment (as per AGENTS.md interpretation and errors),
// this story will primarily show the component using the actual hook.
// The data displayed will depend on the default state of the useDueMedications hook
// in Storybook's environment (likely empty if no global providers supply necessary data).
// This is fine for a basic rendering test of the component's structure.

export const Default: Story = {
	args: {
		// Props for DueMedicationsDisplay itself, if any, would go here.
		// onSelectDueMedication is already in meta.args.
	},
	// No decorators or play functions that attempt to mock useDueMedications.
};

// Note: This simplified story structure is a consequence of not being able to use
// Vitest's mocking utilities (vi.mock, vi.fn, mockReturnValue) reliably within
// the Storybook environment for this project, as per AGENTS.md and observed errors.
// The component's behavior with different data states (empty, loading, with items)
// is expected to be covered by Vitest unit tests where mocking is fully supported.
// The primary goal here is to ensure the component renders without Storybook runtime errors.
// The previous 'lexical declaration' error was likely due to the vi.mock attempts.
// By removing them, this story should at least load and render the component.
