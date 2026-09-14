import { fbt } from 'fbtee';
import { Loader2, MapPin, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface LocationPickerProps {
	latitude?: number | string;
	longitude?: number | string;
	onChange: (lat?: number, lon?: number) => void;
}

export function LocationPicker({
	latitude,
	longitude,
	onChange,
}: LocationPickerProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hasLocation =
		latitude !== undefined &&
		latitude !== '' &&
		longitude !== undefined &&
		longitude !== '';

	const handleGetLocation = () => {
		if (typeof window === 'undefined' || !('geolocation' in navigator)) {
			setError(
				String(
					fbt(
						'Geolocation is not supported by your device or browser.',
						'Error message when geolocation is not supported',
					),
				),
			);
			return;
		}

		setIsLoading(true);
		setError(null);

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setIsLoading(false);
				const lat = Math.round(position.coords.latitude * 100000) / 100000;
				const lon = Math.round(position.coords.longitude * 100000) / 100000;
				onChange(lat, lon);
			},
			(err) => {
				setIsLoading(false);
				let message = String(
					fbt(
						'Unable to retrieve your location.',
						'Generic error message for failed geolocation request',
					),
				);
				if (err.code === err.PERMISSION_DENIED) {
					message = String(
						fbt(
							'Location access was denied.',
							'Error message when geolocation permission is denied',
						),
					);
				} else if (err.code === err.POSITION_UNAVAILABLE) {
					message = String(
						fbt(
							'Location information is unavailable.',
							'Error message when location position is unavailable',
						),
					);
				} else if (err.code === err.TIMEOUT) {
					message = String(
						fbt(
							'Location request timed out.',
							'Error message when location request times out',
						),
					);
				}
				setError(message);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
			},
		);
	};

	const handleClearLocation = () => {
		setError(null);
		onChange(undefined, undefined);
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="flex items-center gap-1.5">
					<MapPin className="h-4 w-4 text-muted-foreground" />
					<fbt desc="Label for location section in forms">Location</fbt>
				</Label>
				{hasLocation && (
					<Button
						className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
						data-testid="clear-location-button"
						onClick={handleClearLocation}
						type="button"
						variant="ghost"
					>
						<Trash2 className="h-3 w-3 mr-1" />
						<fbt desc="Button label to clear location">Clear</fbt>
					</Button>
				)}
			</div>

			<div className="flex flex-col gap-2">
				<Button
					className="w-full"
					data-testid="get-location-button"
					disabled={isLoading}
					onClick={handleGetLocation}
					type="button"
					variant="outline"
				>
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							<fbt desc="Loading state while acquiring location">
								Acquiring location...
							</fbt>
						</>
					) : (
						<>
							<MapPin className="h-4 w-4 mr-2" />
							{hasLocation ? (
								<fbt desc="Button label to update current location">
									Update Current Location
								</fbt>
							) : (
								<fbt desc="Button label to get device location">
									Use Current Location
								</fbt>
							)}
						</>
					)}
				</Button>

				{hasLocation && (
					<div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 font-mono">
						{latitude}, {longitude}
					</div>
				)}

				{error && <p className="text-xs text-destructive">{error}</p>}
			</div>
		</div>
	);
}
