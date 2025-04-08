'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export type AutocompleteOption = {
	value: string;
	label: string;
};

interface AutocompleteProps {
	options: AutocompleteOption[];
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	emptyMessage?: string;
	className?: string;
	createOption?: (inputValue: string) => AutocompleteOption;
}

export function Autocomplete({
	options,
	value,
	onValueChange,
	placeholder = 'Select an option',
	emptyMessage = 'No options found.',
	className,
	createOption,
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
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn('w-full justify-between', className)}
					onClick={() => setOpen(!open)}
				>
					{value ? selectedLabel : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
				<Command>
					<CommandInput
						placeholder={placeholder}
						value={inputValue}
						onValueChange={setInputValue}
					/>
					<CommandList>
						<CommandEmpty>
							{emptyMessage}
							{createOption && inputValue && (
								<Button
									variant="outline"
									className="mt-2 w-full"
									onClick={handleCreateOption}
								>
									"{inputValue}" hinzufügen
								</Button>
							)}
						</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={(currentValue) => {
										onValueChange(currentValue);
										setOpen(false);
									}}
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
