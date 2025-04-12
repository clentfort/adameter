'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DiaperChange } from '@/types/diaper';
import { addDays, differenceInDays } from 'date-fns';
import { useState } from 'react';

interface DiaperStatsProps {
	diaperChanges: DiaperChange[];
}

export default function DiaperStats({ diaperChanges = [] }: DiaperStatsProps) {
	const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | 'all'>('7');

	// Ensure diaperChanges is an array
	const changesArray = Array.isArray(diaperChanges) ? diaperChanges : [];

	// Filter changes based on selected time range
	const filteredChanges = (() => {
		if (timeRange === 'all') return changesArray;

		const now = new Date();
		const daysToLookBack = Number.parseInt(timeRange);
		const cutoffDate = addDays(now, -daysToLookBack);
		return changesArray.filter(
			(change) => new Date(change.timestamp) >= cutoffDate,
		);
	})();

	if (filteredChanges.length === 0) {
		return (
            <Card>
                <CardHeader className="p-4 pb-2">
					<CardTitle className="text-base"><fbt desc="diaperStatistics">Diaper Statistics</fbt></CardTitle>
				</CardHeader>
                <CardContent className="p-4 pt-0">
					<p className="text-muted-foreground text-center py-4">
						<fbt desc="noDiaperDataAvailable">No diaper data available for the selected time range.</fbt>
					</p>
				</CardContent>
            </Card>
        );
	}

	// Calculate statistics
	const totalChanges = filteredChanges.length;
	const urineOnly = filteredChanges.filter(
		(c) => c.containsUrine && !c.containsStool,
	).length;
	const withStool = filteredChanges.filter((c) => c.containsStool).length;
	const withLeakage = filteredChanges.filter((c) => c.leakage).length;

	// Calculate changes per day
	const oldestChange = new Date(
		Math.min(...filteredChanges.map((c) => new Date(c.timestamp).getTime())),
	);
	const newestChange = new Date(
		Math.max(...filteredChanges.map((c) => new Date(c.timestamp).getTime())),
	);
	const daysDiff = Math.max(
		1,
		differenceInDays(newestChange, oldestChange) + 1,
	);
	const changesPerDay = (totalChanges / daysDiff).toFixed(1);

	// Calculate diaper brand statistics
	const brandCounts: Record<string, { leakage: number; total: number }> = {};
	filteredChanges.forEach((change) => {
		if (change.diaperBrand) {
			if (!brandCounts[change.diaperBrand]) {
				brandCounts[change.diaperBrand] = { leakage: 0, total: 0 };
			}
			brandCounts[change.diaperBrand].total++;
			if (change.leakage) {
				brandCounts[change.diaperBrand].leakage++;
			}
		}
	});

	// Sort brands by usage count
	const sortedBrands = Object.entries(brandCounts)
		.sort(([, countA], [, countB]) => countB.total - countA.total)
		.slice(0, 5); // Top 5 brands

	// Sort brands by leakage percentage (for those with at least 3 uses)
	const leakageBrands = Object.entries(brandCounts)
		.filter(([, stats]) => stats.total >= 3) // Only consider brands with at least 3 uses
		.sort(
			([, statsA], [, statsB]) =>
				statsB.leakage / statsB.total - statsA.leakage / statsA.total,
		)
		.slice(0, 5); // Top 5 leaking brands

	return (
        <Card>
            <CardHeader className="p-4 pb-2">
				<CardTitle className="text-base"><fbt desc="diaperStatistics">Diaper Statistics</fbt></CardTitle>
			</CardHeader>
            <CardContent className="p-4 pt-0">
				<Tabs className="w-full" defaultValue="overview">
					<TabsList className="grid grid-cols-3 mb-4">
						<TabsTrigger value="overview"><fbt desc="overview">Overview</fbt></TabsTrigger>
						<TabsTrigger value="brands"><fbt desc="diaperBrands">Diaper Brands</fbt></TabsTrigger>
						<TabsTrigger value="leakage"><fbt desc="leakage">Diaper leaked</fbt></TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-4" value="overview">
						<div className="grid grid-cols-2 gap-4">
							<div className="border rounded-md p-3">
								<p className="text-sm text-muted-foreground"><fbt desc="total">Total</fbt></p>
								<p className="text-2xl font-bold">{totalChanges}</p>
							</div>
							<div className="border rounded-md p-3">
								<p className="text-sm text-muted-foreground"><fbt desc="perDay">Per Day</fbt></p>
								<p className="text-2xl font-bold">{changesPerDay}</p>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="border rounded-md p-3 bg-yellow-50">
								<p className="text-sm text-yellow-800"><fbt desc="urineOnly">Urine Only</fbt></p>
								<p className="text-xl font-bold text-yellow-800">{urineOnly}</p>
								<p className="text-xs text-yellow-600">
									{Math.round((urineOnly / totalChanges) * 100)}%
								</p>
							</div>
							<div className="border rounded-md p-3 bg-amber-50">
								<p className="text-sm text-amber-800"><fbt desc="withStool">With Stool</fbt></p>
								<p className="text-xl font-bold text-amber-800">{withStool}</p>
								<p className="text-xs text-amber-600">
									{Math.round((withStool / totalChanges) * 100)}%
								</p>
							</div>
							<div className="border rounded-md p-3 bg-red-50">
								<p className="text-sm text-red-800"><fbt desc="withLeakage">With Leakage</fbt></p>
								<p className="text-xl font-bold text-red-800">{withLeakage}</p>
								<p className="text-xs text-red-600">
									{Math.round((withLeakage / totalChanges) * 100)}%
								</p>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="brands">
						{sortedBrands.length > 0 ? (
							<div className="space-y-3">
								{sortedBrands.map(([brand, stats]) => (
									<div className="flex items-center" key={brand}>
										<div className="w-full bg-gray-200 rounded-full h-4">
											<div
												className="bg-blue-600 h-4 rounded-full"
												style={{
													width: `${(stats.total / totalChanges) * 100}%`,
												}}
											></div>
										</div>
										<div className="ml-3 min-w-[100px]">
											<span className="text-sm font-medium">{brand}</span>
											<span className="text-xs text-muted-foreground ml-2">
												{stats.total} (
												{Math.round((stats.total / totalChanges) * 100)}%)
											</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-center py-4">
								<fbt desc="noDiaperBrandsRecorded">No diaper brands recorded.</fbt>
							</p>
						)}
					</TabsContent>

					<TabsContent value="leakage">
						{leakageBrands.length > 0 ? (
							<div className="space-y-4">
								<p className="text-sm text-muted-foreground">
									<fbt desc="diaperBrandsByLeakage">Diaper brands by leakage frequency (min. 3 uses)</fbt>
								</p>

								<div className="space-y-3">
									{leakageBrands.map(([brand, stats]) => {
										const leakagePercent = Math.round(
											(stats.leakage / stats.total) * 100,
										);
										return (
											<div className="border rounded-md p-3" key={brand}>
												<div className="flex justify-between items-center mb-1">
													<span className="font-medium">{brand}</span>
													<span
														className={`text-sm ${leakagePercent > 20 ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}
													>
														{leakagePercent}% ausgelaufen
													</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-3">
													<div
														className={`h-3 rounded-full ${leakagePercent > 20 ? 'bg-red-500' : 'bg-amber-500'}`}
														style={{ width: `${leakagePercent}%` }}
													></div>
												</div>
												<p className="text-xs text-muted-foreground mt-1">
													{stats.leakage} von {stats.total} Windeln
												</p>
											</div>
										);
									})}
								</div>
							</div>
						) : (
							<p className="text-muted-foreground text-center py-4">
								<fbt desc="noLeakageDataAvailable">Not enough data for leakage statistics.</fbt>
							</p>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
        </Card>
    );
}
