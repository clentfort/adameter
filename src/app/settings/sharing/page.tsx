'use client';

import { fbt } from 'fbtee';
import { DataSharingContent } from '@/components/root-layout/data-sharing-switcher';
import { Card, CardContent } from '@/components/ui/card';

export default function SharingSettingsPage() {
	return (
		<div className="space-y-4 w-full">
			<Card>
				<CardContent>
					<div className="flex flex-col gap-4">
						<p className="text-sm text-muted-foreground pt-4">
							{fbt(
								'Synchronize your data across multiple devices by joining a shared room.',
								'Description of sharing feature',
							)}
						</p>
						<DataSharingContent />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
