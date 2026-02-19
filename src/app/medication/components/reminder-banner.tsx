'use client';

import { fbt } from 'fbtee';
import { AlertCircle } from 'lucide-react';

export default function ReminderBanner({
	overdueCount,
}: {
	overdueCount: number;
}) {
	if (overdueCount === 0) {
		return null;
	}

	return (
		<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800 mb-6">
			<AlertCircle className="h-5 w-5 shrink-0" />
			<p className="text-sm font-medium">
				<fbt desc="Alert message for overdue medications">
					You have <fbt:param name="count">{overdueCount}</fbt:param> overdue
					medication(s).
				</fbt>
			</p>
		</div>
	);
}
