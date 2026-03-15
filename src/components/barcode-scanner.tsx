'use client';

import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
	onScan: (decodedText: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
	const [error, setError] = useState<string | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const containerId = 'barcode-reader';

	const startScanner = async () => {
		try {
			setError(null);
			setIsScanning(true);
			const html5QrCode = new Html5Qrcode(containerId);
			scannerRef.current = html5QrCode;

			const config = {
				formatsToSupport: [
					Html5QrcodeSupportedFormats.EAN_13,
					Html5QrcodeSupportedFormats.EAN_8,
					Html5QrcodeSupportedFormats.UPC_A,
					Html5QrcodeSupportedFormats.UPC_E,
					Html5QrcodeSupportedFormats.CODE_128,
					Html5QrcodeSupportedFormats.CODE_39,
					Html5QrcodeSupportedFormats.QR_CODE,
				],
				fps: 10,
				qrbox: { height: 150, width: 250 },
			};

			await html5QrCode.start(
				{ facingMode: 'environment' },
				config,
				(decodedText) => {
					void stopScanner();
					onScan(decodedText);
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
					<fbt desc="Button to start the barcode scanner">
						Start Barcode Scanner
					</fbt>
				</Button>
			) : (
				<Button onClick={stopScanner} type="button" variant="ghost">
					<fbt desc="Button to stop the barcode scanner">Stop Scanner</fbt>
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
