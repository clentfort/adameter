import type { Meta, StoryObj } from '@storybook/react';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button'; // Example component to show theme effects
import { ThemeProvider } from './theme-provider';

// Helper component to demonstrate theme switching
const ThemeSwitcherDemo = () => {
	const { setTheme, theme } = useTheme();

	return (
		<div className="p-4 rounded-md border">
			<p className="mb-2">Current theme: {theme}</p>
			<div className="flex gap-2">
				<Button
					onClick={() => setTheme('light')}
					variant={theme === 'light' ? 'default' : 'outline'}
				>
					Light
				</Button>
				<Button
					onClick={() => setTheme('dark')}
					variant={theme === 'dark' ? 'default' : 'outline'}
				>
					Dark
				</Button>
				<Button
					onClick={() => setTheme('system')}
					variant={theme === 'system' ? 'default' : 'outline'}
				>
					System
				</Button>
			</div>
			<div className="mt-4 p-4 bg-background text-foreground border rounded">
				This is a themed box. It will change based on the selected theme.
				<Button className="ml-2">Themed Button</Button>
			</div>
		</div>
	);
};

const meta: Meta<typeof ThemeProvider> = {
	argTypes: {
		attribute: { control: 'text' },
		defaultTheme: { control: 'select', options: ['light', 'dark', 'system'] },
		enableSystem: { control: 'boolean' },
		storageKey: { control: 'text' },
	},
	component: ThemeProvider,
	decorators: [
		(Story, context) => {
			// Ensure that when a story re-renders (e.g. args change), the theme is reset if needed.
			// This is a bit of a workaround for Storybook's iframe context.
			const { setTheme } = useTheme();
			useEffect(() => {
				if (context.args.defaultTheme) {
					setTheme(context.args.defaultTheme as string);
				}
			}, [context.args.defaultTheme, setTheme]);

			return <Story />;
		},
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Components/ThemeProvider',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultLight: Story = {
	args: {
		attribute: 'class',
		children: <ThemeSwitcherDemo />,
		defaultTheme: 'light',
		enableSystem: true,
		storageKey: 'storybook-theme', // Use a different storage key for storybook to avoid conflicts
	},
};

export const DefaultDark: Story = {
	args: {
		...DefaultLight.args,
		children: <ThemeSwitcherDemo />,
		defaultTheme: 'dark',
	},
};

export const SystemTheme: Story = {
	args: {
		...DefaultLight.args,
		children: <ThemeSwitcherDemo />,
		defaultTheme: 'system',
	},
	parameters: {
		docs: {
			description: {
				story:
					"The 'system' theme will attempt to match the user's operating system preference. " +
					"In Storybook's isolated environment, this might default to light or dark based on Storybook's own or browser settings. " +
					'Test on a live page for true system theme behavior.',
			},
		},
	},
};

export const WithCustomStorageKey: Story = {
	args: {
		...DefaultLight.args,
		children: (
			<div>
				<p className="mb-2 text-sm text-muted-foreground">
					This instance of ThemeProvider uses a custom localStorage key:
					&quot;my-custom-theme-key&quot;.
				</p>
				<ThemeSwitcherDemo />
			</div>
		),
		storageKey: 'my-custom-theme-key',
	},
};

export const WithoutSystemPreference: Story = {
	args: {
		...DefaultLight.args,
		children: (
			<div>
				<p className="mb-2 text-sm text-muted-foreground">
					In this version, <code>enableSystem</code> is false. The
					&quot;System&quot; option will default to the{' '}
					<code>defaultTheme</code>.
				</p>
				<ThemeSwitcherDemo />
			</div>
		),
		defaultTheme: 'light', // System will not be an option if enableSystem is false
		enableSystem: false,
	},
};
