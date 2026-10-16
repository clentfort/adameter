import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from './dropdown-menu';

describe('DropdownMenu components', () => {
	it('renders all dropdown menu primitives and subcomponents correctly', () => {
		render(
			<DropdownMenu open>
				<DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
				<DropdownMenuPortal>
					<DropdownMenuContent className="custom-content" align="center" side="top">
						<DropdownMenuGroup className="custom-group">
							<DropdownMenuLabel inset className="custom-label">
								Menu Header
							</DropdownMenuLabel>
							<DropdownMenuItem inset variant="destructive" className="custom-item">
								Delete Item
								<DropdownMenuShortcut className="custom-shortcut">Ctrl+D</DropdownMenuShortcut>
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator className="custom-separator" />
						<DropdownMenuCheckboxItem checked inset className="custom-checkbox">
							Checkbox Option
						</DropdownMenuCheckboxItem>
						<DropdownMenuRadioGroup value="option1">
							<DropdownMenuRadioItem value="option1" inset className="custom-radio">
								Radio Option 1
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
						<DropdownMenuSub open>
							<DropdownMenuSubTrigger inset className="custom-sub-trigger">
								Submenu
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent className="custom-sub-content">
								<DropdownMenuItem>Sub Item</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenuPortal>
			</DropdownMenu>,
		);

		expect(screen.getByText('Open Menu')).toBeInTheDocument();
		expect(screen.getByText('Menu Header')).toBeInTheDocument();
		expect(screen.getByText('Delete Item')).toBeInTheDocument();
		expect(screen.getByText('Ctrl+D')).toBeInTheDocument();
		expect(screen.getByText('Checkbox Option')).toBeInTheDocument();
		expect(screen.getByText('Radio Option 1')).toBeInTheDocument();
		expect(screen.getByText('Submenu')).toBeInTheDocument();
		expect(screen.getByText('Sub Item')).toBeInTheDocument();
	});
});
