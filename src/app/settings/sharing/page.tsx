'use client';

import { fbt } from 'fbtee';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsHeader } from '../components/settings-header';
import { DataSharingContent } from './components/data-sharing-content';

export default function SharingSettingsPage() {
	return (
		<>
			<SettingsHeader
				title={fbt('Sharing', 'Title for sharing settings section')}
			/>

			<div className="space-y-4 w-full">
				<Card>
					<CardContent>
						<DataSharingContent />
					</CardContent>
				</Card>
			</div>
		</>
	);
}
