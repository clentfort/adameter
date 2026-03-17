import { fbt } from 'fbtee';

const TOOLTIP_WIDTH = 128;

interface HeatMapTooltipProps {
	activeInterval: { count: number; time: string };
	containerRect: DOMRect;
	pointerX: number;
}

export function HeatMapTooltip({
	activeInterval,
	containerRect,
	pointerX,
}: HeatMapTooltipProps) {
	// Interaction point relative to the window
	const absInteractionX = containerRect.left + pointerX;
	const halfWidth = TOOLTIP_WIDTH / 2;

	// Clamp the tooltip center X position relative to the viewport
	// 8px margin from the screen edges
	const absClampedX =
		typeof window !== 'undefined'
			? Math.max(
					halfWidth + 8,
					Math.min(absInteractionX, window.innerWidth - halfWidth - 8),
				)
			: absInteractionX;

	// Convert back to container-relative X for positioning
	const clampedX = absClampedX - containerRect.left;

	// Calculate pin offset relative to the clamped bubble center
	const rawOffset = absInteractionX - absClampedX;

	// Constrain pin to stay within bubble's flat bottom edge (avoiding corners)
	const triangleOffset = Math.max(-50, Math.min(50, rawOffset));

	return (
		<div
			className="absolute z-20 pointer-events-none transition-transform duration-75 ease-out"
			style={{
				left: clampedX,
				top: -8,
				transform: 'translate(-50%, -100%)',
			}}
		>
			<div className="flex flex-col items-center">
				<div className="bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 rounded-lg px-4 py-2 shadow-2xl flex flex-col items-center w-32 border border-white/10 dark:border-black/10 animate-in fade-in zoom-in-95 duration-100 ring-4 ring-black/10 dark:ring-white/10 whitespace-nowrap">
					<span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">
						<fbt desc="Time label in the heat map tooltip">
							<fbt:param name="time">{activeInterval.time}</fbt:param>
						</fbt>
					</span>
					<span className="text-sm font-black tracking-tight">
						{activeInterval.count === 1 ? (
							<fbt desc="Singular count of feedings in the heat map tooltip">
								1 Feeding
							</fbt>
						) : (
							<fbt desc="Plural count of feedings in the heat map tooltip">
								<fbt:param name="count">{activeInterval.count}</fbt:param>{' '}
								Feedings
							</fbt>
						)}
					</span>
				</div>
				<div className="relative w-full h-0">
					<div
						className="absolute w-3 h-3 bg-zinc-900 dark:bg-zinc-100 -mt-1.5 shadow-lg origin-center left-1/2"
						style={{
							transform: `translateX(calc(-50% + ${triangleOffset}px)) rotate(45deg)`,
						}}
					/>
				</div>
			</div>
		</div>
	);
}
