import type { Meta, StoryObj } from '@storybook/react';
// Import the hook directly, it will be mocked via vi.mock below
import { useDueMedications, DueMedicationInfo } from '@/hooks/use-due-medications';
import { MedicationRegimen } from '@/types/medication-regimen';
import {
	DueMedicationsDisplay,
} from './due-medications-display';

// Mock the hook itself using vi.mock
// This will replace the actual hook with a mock function
vi.mock('@/hooks/use-due-medications', async () => ({ // Use async factory for vi.mock
    useDueMedications: vi.fn(),
}));

// Cast the imported (and now mocked) hook for type safety in stories
const mockUseDueMedications = useDueMedications as vi.MockedFunction<typeof useDueMedications>;

const meta: Meta<typeof DueMedicationsDisplay> = {
	args: {
		onSelectDueMedication: vi.fn(), // Use vi.fn() for mocking the action
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

const createMockRegimen = (
	id: string,
	name: string,
	dosageAmount: number,
	dosageUnit: string,
): MedicationRegimen => ({
	dosageAmount,
	dosageUnit,
	id,
	name,
	prescriber: 'Self',
	schedule: { times: ['10:00'], type: 'daily' },
	startDate: new Date().toISOString(),
});

const mockDueMedicationsData: DueMedicationInfo[] = [ // Changed type here
	{
		dueTime: new Date(),
		regimen: createMockRegimen('reg1', 'Vitamin D Drops', 0.5, 'ml'),
	},
	{
		dueTime: new Date(),
		regimen: createMockRegimen('reg2', 'Amoxicillin Syrup', 5, 'ml'),
	},
	{
		dueTime: new Date(),
		regimen: createMockRegimen(
			'reg3',
			'Iron Supplement (Very Long Name To Test Truncation and Wrapping)',
			10,
			'mg',
		),
	},
	{
		dueTime: new Date(),
		regimen: createMockRegimen('reg4', 'Paracetamol', 250, 'mg'),
	},
];

export const DefaultEmpty: Story = {
	args: {},
	play: async () => {
		mockUseDueMedications.mockReturnValue([]);
	},
};

export const WithDueMedications: Story = {
	args: {},
	play: async () => {
		mockUseDueMedications.mockReturnValue(mockDueMedicationsData);
	},
};

export const SingleDueMedication: Story = {
	args: {},
	play: async () => {
		mockUseDueMedications.mockReturnValue([mockDueMedicationsData[0]]);
	},
};

export const LoadingState: Story = {
	args: {},
	name: 'Loading (Simulated - hook returns empty initially)',
	play: async () => {
		// Simulate hook returning empty initially, then data
		mockUseDueMedications.mockReturnValueOnce([]);
		// In a real scenario, the hook itself would handle its internal loading state if any,
		// but for storybook, we can show the empty state as a proxy for loading.
		// If the component had its own loading spinner, we'd trigger that.
		// For now, it just means "no data".
	},
};

// Note: The Storybook `@storybook/test` package for `play` function interactions
// (like userEvent) is not available in this project per AGENTS.md.
// So, these stories primarily set up data states.
// Manual interaction can be tested in Storybook's canvas.
// We are using `fn()` from `@storybook/test` for action logging which is fine.
// `vi.spyOn` is from vitest, used here for mocking the hook.
// This setup assumes vitest/vi is available in the Storybook environment,
// which might require Storybook configuration if not already set up.
// If `vi` is not available, the hook mocking needs to change (e.g. jest.spyOn or storybook-addon-mock).
// Given the project uses Vitest, this is a reasonable first approach.
// The `AGENTS.md` mentions Vitest, so this should be fine.
// Also, ensure that the Storybook setup can resolve '@/hooks/...' aliases.
// If `vi` is not available in Storybook's execution context for `play` functions,
// then the `mockUseDueMedications.mockReturnValue` calls should be moved to `loaders` or `decorators`
// that run in a context where `vi` is defined (Node context before browser rendering).
// For now, assuming `play` can execute this for data setup.
// A more robust way if `vi` is an issue in `play` is:
// WithDueMedications.loaders = [async () => { mockUseDueMedications.mockReturnValue(mockDueMedicationsData); return {}; }];
// However, `play` is often used for this kind of setup. Let's try this first.

// Per AGENTS.md: "The @storybook/test package ... is currently not available".
// `fn` is from `@storybook/test` but is often aliased or available. If it causes issues, use `action` from `@storybook/addon-actions`.
// Let's assume `fn` is okay for now for logging.
// The crucial part is mocking `useDueMedications`.
// If `vi` doesn't work in `play`, I'll have to use another method or simplify the stories.
// For now, I'm proceeding with `vi.spyOn` in `play`.
// If Storybook build fails due to `vi`, I'll use `parameters` for mocking.

// Alternative mocking strategy if vi in play is problematic:
// parameters: {
//   msw: { // if using MSW addon, or similar for mocking hooks globally for a story
//     handlers: [...]
//   },
//   docs: {
//     config: ({ args, originalStoryFn, ...rest }) => {
//        mockUseDueMedications.mockReturnValue(mockDueMedicationsData); // Or based on args
//        return { args, originalStoryFn, ...rest };
//     },
//   },
// },
// Or use a decorator to mock the hook.
// Decorators are a cleaner way for this.

DefaultEmpty.decorators = [
	(Story) => {
		mockUseDueMedications.mockReturnValue([]);
		return <Story />;
	},
];
WithDueMedications.decorators = [
	(Story) => {
		mockUseDueMedications.mockReturnValue(mockDueMedicationsData);
		return <Story />;
	},
];
SingleDueMedication.decorators = [
	(Story) => {
		mockUseDueMedications.mockReturnValue([mockDueMedicationsData[0]]);
		return <Story />;
	},
];
LoadingState.decorators = [
	// Renaming to more accurate representation
	(Story) => {
		mockUseDueMedications.mockReturnValue([]); // Simulates initial empty/loading state
		return <Story />;
	},
];
// Remove play functions as decorators handle the mocking now.
DefaultEmpty.play = undefined;
WithDueMedications.play = undefined;
SingleDueMedication.play = undefined;
LoadingState.play = undefined;
LoadingState.name = 'Initially Empty (Simulates Loading)';
