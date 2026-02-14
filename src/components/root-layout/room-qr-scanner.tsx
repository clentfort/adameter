'use client';

import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface RoomQRScannerProps {
	onScan: (roomId: string) => void;
}

export function RoomQRScanner({ onScan }: RoomQRScannerProps) {
	const [error, setError] = useState<string | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const containerId = 'qr-reader';

	const startScanner = async () => {
		try {
			setError(null);
			setIsScanning(true);
			const html5QrCode = new Html5Qrcode(containerId);
			scannerRef.current = html5QrCode;

			const config = { fps: 10, qrbox: { height: 250, width: 250 } };

			await html5QrCode.start(
				{ facingMode: 'environment' },
				config,
				(decodedText) => {
					try {
						const url = new URL(decodedText);
						const roomId = url.searchParams.get('room');
						if (roomId) {
							void stopScanner();
							onScan(roomId);
						}
					} catch {
						// Not a URL, maybe it's just the room ID
						void stopScanner();
						onScan(decodedText);
					}
				},
				() => {
					// Failure callback, ignored to avoid noise
				},
			);
		} catch (error_) {
			setError(String(error_));
			setIsScanning(false);
		}
	};

	const stopScanner = async () => {
		if (scannerRef.current) {
			try {
				await scannerRef.current.stop();
				scannerRef.current = null;
			} catch {
				// Failed to stop scanner
			}
		}
		setIsScanning(false);
	};

	useEffect(() => {
		return () => {
			if (scannerRef.current) {
				void scannerRef.current.stop();
			}
		};
	}, []);

	return (
		<div className="flex flex-col gap-4">
			{!isScanning ? (
				<Button onClick={startScanner} type="button" variant="outline">
					Start Camera Scanner
				</Button>
			) : (
				<Button onClick={stopScanner} type="button" variant="ghost">
					Stop Scanner
				</Button>
			)}

			{error && <p className="text-sm text-red-500">{error}</p>}

			<div
				className="overflow-hidden rounded-lg bg-slate-100"
				id={containerId}
				style={{ minHeight: isScanning ? '300px' : '0' }}
			/>
		</div>
	);
}
