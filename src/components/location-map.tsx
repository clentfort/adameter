import { fbt } from 'fbtee';
import { ExternalLink, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationMapProps {
	className?: string;
	latitude: number;
	longitude: number;
}

export function LocationMap({
	className,
	latitude,
	longitude,
}: LocationMapProps) {
	const delta = 0.005;
	const minLon = longitude - delta;
	const minLat = latitude - delta;
	const maxLon = longitude + delta;
	const maxLat = latitude + delta;

	const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${latitude}%2C${longitude}`;
	const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

	return (
		<div className={cn('mt-2 space-y-1', className)} data-testid="location-map">
			<div className="overflow-hidden rounded-md border border-border bg-muted/20">
				<iframe
					className="w-full h-48 border-0"
					loading="lazy"
					src={iframeSrc}
					title={String(
						fbt('Location map', 'Title for OpenStreetMap embed iframe'),
					)}
				/>
			</div>
			<div className="flex items-center justify-between text-xs text-muted-foreground px-1">
				<span className="flex items-center gap-1 font-mono">
					<MapPin className="h-3 w-3" />
					{latitude.toFixed(5)}, {longitude.toFixed(5)}
				</span>
				<a
					className="hover:underline flex items-center gap-1"
					href={osmUrl}
					rel="noopener noreferrer"
					target="_blank"
				>
					<fbt desc="Link text to view larger map on OpenStreetMap">
						View on OpenStreetMap
					</fbt>
					<ExternalLink className="h-3 w-3" />
				</a>
			</div>
		</div>
	);
}
