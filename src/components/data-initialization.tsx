'use client';

import { useEffect } from 'react';
import { DIAPER_BRANDS } from '@/app/diaper/utils/diaper-brands';
import { useDiaperBrands } from '@/hooks/use-diaper-brands';
import { DiaperBrand } from '@/types/diaper-brand';

export default function DataInitialization() {
	const { replace: replaceBrands, value: brands } = useDiaperBrands();

	useEffect(() => {
		if (brands.length === 0) {
			const initialBrands: DiaperBrand[] = DIAPER_BRANDS.filter(
				(b) => b.value !== 'andere',
			).map((b) => ({
				costPerDiaper: 0,
				id: b.value,
				isReusable: b.value === 'stoffwindel',
				name: b.label,
				upfrontCost: 0,
			}));
			if (initialBrands.length > 0) {
				replaceBrands(initialBrands);
			}
		}
	}, [brands.length, replaceBrands]);

	return null;
}
