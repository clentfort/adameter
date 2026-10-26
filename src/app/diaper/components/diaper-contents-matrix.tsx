import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type MatrixField =
	'containsUrine' | 'containsStool' | 'pottyUrine' | 'pottyStool';

export interface DiaperContentsMatrixProps {
	containsStool: boolean;
	containsUrine: boolean;
	leakage: boolean;
	onLeakageChange: (leakage: boolean) => void;
	onToggle: (field: MatrixField) => void;
	pottyStool: boolean;
	pottyUrine: boolean;
}

interface MatrixToggleButtonProps {
	isSelected: boolean;
	label: string;
	onClick: () => void;
	testId: string;
}

function MatrixToggleButton({
	isSelected,
	label,
	onClick,
	testId,
}: MatrixToggleButtonProps) {
	return (
		<Button
			className={cn(
				'h-12 w-full transition-all',
				isSelected
					? 'ring-2 ring-primary ring-offset-1 border-primary bg-primary/10 shadow-xs'
					: 'text-muted-foreground',
			)}
			data-testid={testId}
			onClick={onClick}
			type="button"
			variant="outline"
		>
			<span className="text-xl">{label}</span>
		</Button>
	);
}

interface MatrixRowProps {
	isStoolSelected: boolean;
	isUrineSelected: boolean;
	onStoolToggle: () => void;
	onUrineToggle: () => void;
	rowLabel: ReactNode;
	stoolTestId: string;
	urineTestId: string;
}

function MatrixRow({
	isStoolSelected,
	isUrineSelected,
	onStoolToggle,
	onUrineToggle,
	rowLabel,
	stoolTestId,
	urineTestId,
}: MatrixRowProps) {
	return (
		<>
			<div className="text-sm font-medium">{rowLabel}</div>
			<MatrixToggleButton
				isSelected={isUrineSelected}
				label="💧"
				onClick={onUrineToggle}
				testId={urineTestId}
			/>
			<MatrixToggleButton
				isSelected={isStoolSelected}
				label="💩"
				onClick={onStoolToggle}
				testId={stoolTestId}
			/>
		</>
	);
}

export function DiaperContentsMatrix({
	containsStool,
	containsUrine,
	leakage,
	onLeakageChange,
	onToggle,
	pottyStool,
	pottyUrine,
}: DiaperContentsMatrixProps) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-3 gap-3 items-center">
				<div />
				<div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					<fbt desc="Urine column header">Urine</fbt>
				</div>
				<div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					<fbt desc="Stool column header">Stool</fbt>
				</div>

				<MatrixRow
					isStoolSelected={containsStool}
					isUrineSelected={containsUrine}
					onStoolToggle={() => onToggle('containsStool')}
					onUrineToggle={() => onToggle('containsUrine')}
					rowLabel={
						<fbt desc="Label for the diaper row in the contents matrix">
							Diaper
						</fbt>
					}
					stoolTestId="toggle-diaper-stool"
					urineTestId="toggle-diaper-urine"
				/>

				<MatrixRow
					isStoolSelected={pottyStool}
					isUrineSelected={pottyUrine}
					onStoolToggle={() => onToggle('pottyStool')}
					onUrineToggle={() => onToggle('pottyUrine')}
					rowLabel={
						<fbt desc="Label for the potty row in the contents matrix">
							Potty
						</fbt>
					}
					stoolTestId="toggle-potty-stool"
					urineTestId="toggle-potty-urine"
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Switch
					checked={leakage}
					id="edit-leakage"
					onCheckedChange={onLeakageChange}
				/>
				<Label htmlFor="edit-leakage">
					<fbt desc="Label for a switch button that indicates that a diaper has leaked">
						Diaper leaked
					</fbt>
				</Label>
			</div>
		</div>
	);
}
