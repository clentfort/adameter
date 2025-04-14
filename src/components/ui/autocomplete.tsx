'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type AutocompleteOption = {
	label: string;
	value: string;
};

interface AutocompleteProps {
	className?: string;
	createOption?: (inputValue: string) => AutocompleteOption;
	emptyMessage?: string;
	onValueChange: (value: string) => void;
	options: AutocompleteOption[];
	placeholder?: string;
	value: string;
}

export function Autocomplete({
	className,
	createOption,
	emptyMessage = 'No options found.',
	onValueChange,
	options,
	placeholder = 'Select an option',
	value,
}: AutocompleteProps) {
	const [open, setOpen] = React.useState(false);
	const [inputValue, setInputValue] = React.useState('');

	// Find the selected option label
	const selectedLabel = React.useMemo(() => {
		const option = options.find((opt) => opt.value === value);
		return option ? option.label : value;
	}, [options, value]);

	const handleCreateOption = () => {
		if (!createOption || !inputValue) return;

		const newOption = createOption(inputValue);
		onValueChange(newOption.value);
		setOpen(false);
		setInputValue('');
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className={cn('w-full justify-between', className)}
					onClick={() => setOpen(!open)}
					role="combobox"
					variant="outline"
				>
					{value ? selectedLabel : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
				<Command>
					<CommandInput
						onValueChange={setInputValue}
						placeholder={placeholder}
						value={inputValue}
					/>
					<CommandList>
						<CommandEmpty>
							{emptyMessage}
							{createOption && inputValue && (
								<Button
									className="mt-2 w-full"
									onClick={handleCreateOption}
									variant="outline"
								>
									"{inputValue}" hinzufügen
								</Button>
							)}
						</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									onSelect={(currentValue) => {
										onValueChange(currentValue);
										setOpen(false);
									}}
									value={option.value}
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											value === option.value ? 'opacity-100' : 'opacity-0',
										)}
									/>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
