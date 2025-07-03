'use client';

import type {
	ChangeEvent,
	ForwardedRef,
	InputHTMLAttributes,
	KeyboardEvent,
	ReactNode,
} from 'react';
import { Check } from 'lucide-react';
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface AutocompleteProps<T extends { id: string; label: string }>
	extends Omit<
		InputHTMLAttributes<HTMLInputElement>,
		'value' | 'onChange' | 'onSelect'
	> {
	inputClassName?: string;
	onOptionSelect?: (option: T) => void;
	onValueChange: (value: string) => void;
	options: T[];
	placeholder?: string;
	renderOption?: (option: T) => ReactNode;
	value: string;
}

function Autocomplete<T extends { id: string; label: string }>(
	{
		className,
		disabled,
		inputClassName,
		onOptionSelect,
		onValueChange,
		options,
		placeholder,
		renderOption,
		value,
		...restInputProps
	}: AutocompleteProps<T>,
	ref: ForwardedRef<HTMLInputElement>,
) {
	const [isOpen, setIsOpen] = useState(false);
	const internalInputRef = useRef<HTMLInputElement>(null);
	useImperativeHandle(ref, () => internalInputRef.current!);

	const [filteredOptions, setFilteredOptions] = useState<T[]>(options);

	useEffect(() => {
		let newFilteredOptions: T[];
		if (!value) {
			newFilteredOptions = options;
			setFilteredOptions(newFilteredOptions);
		} else {
			const lowercasedValue = value.toLowerCase();
			newFilteredOptions = options.filter((option) =>
				option.label.toLowerCase().includes(lowercasedValue),
			);
			setFilteredOptions(newFilteredOptions);

			if (newFilteredOptions.length === 0) {
				setIsOpen(false);
			} else {
				if (!isOpen && internalInputRef.current === document.activeElement) {
					setIsOpen(true);
				}
			}
		}
	}, [value, options, isOpen]);

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value;
		onValueChange(newValue);
		if (!isOpen && newValue.length > 0 && options.length > 0) {
			setIsOpen(true);
		} else if (isOpen && newValue.length === 0 && options.length === 0) {
		}
	};

	const handleInputFocus = () => {
		if (value.length > 0 || options.length > 0) {
			setIsOpen(true);
		}
	};

	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Escape') {
			setIsOpen(false);
		} else if (
			!isOpen &&
			(event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
			options.length > 0
		) {
			setIsOpen(true);
		}
	};

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild className={cn('w-full', className)}>
				<div className="w-full">
					<Input
						aria-autocomplete="list"
						aria-controls="autocomplete-list"
						aria-expanded={isOpen}
						className={cn('w-full', inputClassName)}
						disabled={disabled}
						onChange={handleInputChange}
						onFocus={handleInputFocus}
						onKeyDown={handleInputKeyDown}
						placeholder={placeholder}
						ref={internalInputRef}
						role="combobox"
						type="text"
						value={value}
						{...restInputProps}
					/>
				</div>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-[--radix-popover-trigger-width] p-0"
				onOpenAutoFocus={(e) => e.preventDefault()}
				side="bottom"
			>
				<Command
					shouldFilter={false}
				>
					<CommandList id="autocomplete-list">
						<CommandEmpty>No results found.</CommandEmpty>
						<ScrollArea
							style={{ maxHeight: '300px' }}
							type="auto"
						>
							<CommandGroup>
								{filteredOptions.map((option) => (
									<CommandItem
										key={option.id}
										onSelect={() => {
											onValueChange(option.label);
											onOptionSelect?.(option);
											setIsOpen(false);
											setTimeout(() => {
												internalInputRef.current?.focus();
											}, 0);
										}}
										value={option.label}
									>
										{renderOption ? renderOption(option) : option.label}
										<Check
											className={cn(
												'ml-auto h-4 w-4',
												value === option.label ? 'opacity-100' : 'opacity-0',
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						</ScrollArea>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

const ForwardedAutocomplete = forwardRef(Autocomplete) as <
	T extends { id: string; label: string },
>(
	props: AutocompleteProps<T> & { ref?: ForwardedRef<HTMLInputElement> },
) => ReturnType<typeof Autocomplete>;

export { ForwardedAutocomplete as Autocomplete };
