'use client';

import { useState } from 'react';

type ToastVariant = 'default' | 'destructive';

interface Toast {
	id: string;
	title: string;
	description?: string;
	variant?: ToastVariant;
}

interface ToastOptions {
	title: string;
	description?: string;
	variant?: ToastVariant;
}

export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
		const id = Math.random().toString(36).substring(2, 9);
		const newToast: Toast = {
			id,
			title,
			description,
			variant,
		};

		setToasts((prevToasts) => [...prevToasts, newToast]);

		// Auto dismiss after 5 seconds
		setTimeout(() => {
			setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
		}, 5000);

		return id;
	};

	const dismiss = (id: string) => {
		setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
	};

	return {
		toast,
		dismiss,
		toasts,
	};
}
