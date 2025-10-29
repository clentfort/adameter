import type { Tooth } from '@/types/tooth';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils/cn';

const formSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	eruptionDate: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

interface ToothFormProps {
	onClose: () => void;
	onSave: (tooth: Tooth) => void;
	title: React.ReactNode;
	tooth?: Tooth;
}

export default function ToothForm({
	onClose,
	onSave,
	title,
	tooth,
}: ToothFormProps) {
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: tooth?.name || '',
			eruptionDate: tooth?.eruptionDate
				? new Date(tooth.eruptionDate)
				: new Date(),
		},
	});

	const onSubmit = (values: FormValues) => {
		onSave({
			id: tooth?.id || crypto.randomUUID(),
			...values,
			eruptionDate: values.eruptionDate.toISOString(),
		});
	};

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<fbt desc="Label for the tooth name input">Name</fbt>
									</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="eruptionDate"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>
										<fbt desc="Label for the eruption date input">
											Eruption Date
										</fbt>
									</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant={'outline'}
													className={cn(
														'w-full pl-3 text-left font-normal',
														!field.value && 'text-muted-foreground',
													)}
												>
													{field.value ? (
														format(field.value, 'PPP')
													) : (
														<span>
															<fbt desc="Placeholder for the date input">
																Pick a date
															</fbt>
														</span>
													)}
													<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												disabled={(date) =>
													date > new Date() || date < new Date('1900-01-01')
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="submit">
								<fbt desc="Button to save the tooth">Save</fbt>
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}