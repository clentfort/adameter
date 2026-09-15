'use client';

import { fbt } from 'fbtee';
import { ExternalLink, MapPin } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/i18n-context';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

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
	const { resolvedTheme } = useTheme();
	const { locale } = useLanguage();
	const mapContainerRef = useRef<HTMLDivElement>(null);

	const formattedLat = latitude.toFixed(5);
	const formattedLon = longitude.toFixed(5);
	const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

	useEffect(() => {
		let mapInstance: import('leaflet').Map | null = null;
		let isMounted = true;

		void import('leaflet').then((L) => {
			if (!isMounted || !mapContainerRef.current) {
				return;
			}

			// Clean up previous Leaflet instance if present on container
			const container = mapContainerRef.current as HTMLDivElement & {
				_leaflet_id?: number | null;
			};
			if (container._leaflet_id) {
				container._leaflet_id = null;
			}

			const map = L.map(mapContainerRef.current, {
				attributionControl: false,
				boxZoom: false,
				center: [latitude, longitude],
				doubleClickZoom: false,
				dragging: false,
				keyboard: false,
				scrollWheelZoom: false,
				touchZoom: false,
				zoom: 15,
				zoomControl: false,
			});
			mapInstance = map;

			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
			}).addTo(map);

			const pinIcon = L.divIcon({
				className: 'custom-location-map-pin',
				html: `<div class="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground shadow-md -translate-x-1/2 -translate-y-1/2" data-testid="map-pin"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
				iconAnchor: [0, 0],
				iconSize: [0, 0],
			});

			L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);
		});

		return () => {
			isMounted = false;
			if (mapInstance) {
				mapInstance.remove();
				mapInstance = null;
			}
		};
	}, [latitude, longitude]);

	const isDark = resolvedTheme === 'dark';

	return (
		<div
			className={cn('relative w-full border-t border-border', className)}
			data-testid="location-map"
			lang={locale}
		>
			<div className="relative w-full h-48 bg-muted/20 overflow-hidden">
				<div
					aria-label={String(
						fbt('Location map', 'Aria label for non-interactive map tile view'),
					)}
					className={cn(
						'w-full h-full pointer-events-none select-none transition-all',
						isDark && 'invert hue-rotate-180 brightness-85 contrast-125',
					)}
					ref={mapContainerRef}
					role="region"
				/>
			</div>
			<div className="flex items-center justify-between text-xs text-muted-foreground px-4 py-2 bg-muted/30 border-t border-border/50">
				<span className="flex items-center gap-1 font-mono">
					<MapPin className="h-3 w-3 shrink-0" />
					{formattedLat}, {formattedLon}
				</span>
				<a
					className="hover:underline flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
					href={osmUrl}
					rel="noopener noreferrer"
					target="_blank"
				>
					<fbt desc="Link text to view larger map on OpenStreetMap">
						View on OpenStreetMap
					</fbt>
					<ExternalLink className="h-3 w-3 shrink-0" />
				</a>
			</div>
		</div>
	);
}
