'use client';

import { useState } from 'react';

type ToastVariant = 'default' | 'destructive';

interface Toast {
	description?: string;
	id: string;
	title: string;
	variant?: ToastVariant;
}

interface ToastOptions {
	description?: string;
	title: string;
	variant?: ToastVariant;
}

export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const toast = ({ description, title, variant = 'default' }: ToastOptions) => {
		const id = Math.random().toString(36).slice(2, 9);
		const newToast: Toast = {
			description,
			id,
			title,
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
		dismiss,
		toast,
		toasts,
	};
}
