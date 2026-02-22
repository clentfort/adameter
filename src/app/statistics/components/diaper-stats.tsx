'use client';

import type { DiaperChange } from '@/types/diaper';
import { differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ComparisonValue from './comparison-value';

interface DiaperStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
}

function calculateDiaperMetrics(diaperChanges: DiaperChange[]) {
	if (diaperChanges.length === 0) {
		return {
			changesPerDay: '0',
			pottyStool: 0,
			pottyUrine: 0,
			totalChanges: 0,
			totalPottyHits: 0,
			urineOnly: 0,
			withLeakage: 0,
			withStool: 0,
		};
	}

	const totalChanges = diaperChanges.length;
	const urineOnly = diaperChanges.filter(
		(c) => c.containsUrine && !c.containsStool,
	).length;
	const withStool = diaperChanges.filter((c) => c.containsStool).length;
	const withLeakage = diaperChanges.filter((c) => c.leakage).length;

	const pottyUrine = diaperChanges.filter((c) => c.pottyUrine).length;
	const pottyStool = diaperChanges.filter((c) => c.pottyStool).length;
	const totalPottyHits = diaperChanges.filter(
		(c) => c.pottyUrine || c.pottyStool,
	).length;

	const oldestChange = new Date(
		Math.min(...diaperChanges.map((c) => new Date(c.timestamp).getTime())),
	);
	const newestChange = new Date(
		Math.max(...diaperChanges.map((c) => new Date(c.timestamp).getTime())),
	);
	const daysDiff = Math.max(
		1,
		differenceInDays(newestChange, oldestChange) + 1,
	);
	const changesPerDay = (totalChanges / daysDiff).toFixed(1);

	return {
		changesPerDay,
		pottyStool,
		pottyUrine,
		totalChanges,
		totalPottyHits,
		urineOnly,
		withLeakage,
		withStool,
	};
}

export default function DiaperStats({
	comparisonDiaperChanges,
	diaperChanges = [],
}: DiaperStatsProps) {
	if (diaperChanges.length === 0) {
		return (
			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						<fbt desc="Title for the diaper statistics card">
							Diaper Statistics
						</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<p className="text-muted-foreground text-center py-4">
						<fbt desc="Message shown when no diaper data is available for the selected time range">
							No diaper data available for the selected time range.
						</fbt>
					</p>
				</CardContent>
			</Card>
		);
	}

	const metrics = calculateDiaperMetrics(diaperChanges);
	const prevMetrics = comparisonDiaperChanges
		? calculateDiaperMetrics(comparisonDiaperChanges)
		: null;

	const {
		changesPerDay,
		pottyStool,
		pottyUrine,
		totalChanges,
		totalPottyHits,
		urineOnly,
		withLeakage,
		withStool,
	} = metrics;

	const brandCounts: Record<string, { leakage: number; total: number }> = {};
	diaperChanges.forEach((change) => {
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

	const sortedBrands = Object.entries(brandCounts)
		.sort(([, countA], [, countB]) => countB.total - countA.total)
		.slice(0, 5);

	const leakageBrands = Object.entries(brandCounts)
		.filter(([, stats]) => stats.total >= 3)
		.sort(
			([, statsA], [, statsB]) =>
				statsB.leakage / statsB.total - statsA.leakage / statsA.total,
		)
		.slice(0, 5);

	return (
		<Card>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the diaper statistics card">
						Diaper Statistics
					</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<Tabs className="w-full" defaultValue="overview">
					<TabsList className="grid grid-cols-3 mb-4">
						<TabsTrigger value="overview">
							<fbt desc="Label for the overview tab in diaper statistics">
								Overview
							</fbt>
						</TabsTrigger>
						<TabsTrigger value="brands">
							<fbt desc="Label for the diaper brands tab in diaper statistics">
								Diaper Brands
							</fbt>
						</TabsTrigger>
						<TabsTrigger value="leakage">
							<fbt desc="Label for the leakage tab in diaper statistics">
								Diaper leaked
							</fbt>
						</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-4" value="overview">
						<div className="grid grid-cols-2 gap-4">
							<div className="border rounded-md p-3">
								<p className="text-sm text-muted-foreground">
									<fbt desc="Label for the total number of diaper changes">
										Total
									</fbt>
								</p>
								<div className="flex items-baseline">
									<p className="text-2xl font-bold">{totalChanges}</p>
									{prevMetrics && (
										<ComparisonValue
											current={totalChanges}
											previous={prevMetrics.totalChanges}
										/>
									)}
								</div>
							</div>
							<div className="border rounded-md p-3">
								<p className="text-sm text-muted-foreground">
									<fbt desc="Label for the average number of diaper changes per day">
										Per Day
									</fbt>
								</p>
								<div className="flex items-baseline">
									<p className="text-2xl font-bold">{changesPerDay}</p>
									{prevMetrics && (
										<ComparisonValue
											current={Number.parseFloat(changesPerDay)}
											previous={Number.parseFloat(prevMetrics.changesPerDay)}
										/>
									)}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="border rounded-md p-3 bg-yellow-50 dark:bg-yellow-800/30">
								<p className="text-sm text-yellow-800 dark:text-yellow-300">
									<fbt desc="Label for diaper changes that only contain urine">
										Urine Only
									</fbt>
								</p>
								<div className="flex items-baseline">
									<p className="text-xl font-bold text-yellow-800 dark:text-yellow-300">
										{urineOnly}
									</p>
									{prevMetrics && (
										<ComparisonValue
											current={urineOnly}
											previous={prevMetrics.urineOnly}
										/>
									)}
								</div>
								<p className="text-xs text-yellow-600 dark:text-yellow-400">
									{Math.round((urineOnly / totalChanges) * 100)}%
								</p>
							</div>
							<div className="border rounded-md p-3 bg-amber-50 dark:bg-amber-800/30">
								<p className="text-sm text-amber-800 dark:text-amber-300">
									<fbt desc="Label for diaper changes that contain stool">
										With Stool
									</fbt>
								</p>
								<div className="flex items-baseline">
									<p className="text-xl font-bold text-amber-800 dark:text-amber-300">
										{withStool}
									</p>
									{prevMetrics && (
										<ComparisonValue
											current={withStool}
											previous={prevMetrics.withStool}
										/>
									)}
								</div>
								<p className="text-xs text-amber-600 dark:text-amber-400">
									{Math.round((withStool / totalChanges) * 100)}%
								</p>
							</div>
							<div className="border rounded-md p-3 bg-red-50 dark:bg-red-800/30">
								<p className="text-sm text-red-800 dark:text-red-300">
									<fbt desc="Label for diaper changes that had leakage">
										With Leakage
									</fbt>
								</p>
								<div className="flex items-baseline">
									<p className="text-xl font-bold text-red-800 dark:text-red-300">
										{withLeakage}
									</p>
									{prevMetrics && (
										<ComparisonValue
											current={withLeakage}
											inverse={true}
											previous={prevMetrics.withLeakage}
										/>
									)}
								</div>
								<p className="text-xs text-red-600 dark:text-red-400">
									{Math.round((withLeakage / totalChanges) * 100)}%
								</p>
							</div>
						</div>

						<div className="space-y-2">
							<h4 className="text-sm font-semibold">
								<fbt desc="Title for the potty training section in diaper statistics">
									Potty Successes
								</fbt>
							</h4>
							<div className="grid grid-cols-3 gap-4">
								<div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-800/30">
									<p className="text-sm text-blue-800 dark:text-blue-300">
										<fbt desc="Label for total potty hits">Total</fbt>
									</p>
									<div className="flex items-baseline">
										<p className="text-xl font-bold text-blue-800 dark:text-blue-300">
											{totalPottyHits}
										</p>
										{prevMetrics && (
											<ComparisonValue
												current={totalPottyHits}
												previous={prevMetrics.totalPottyHits}
											/>
										)}
									</div>
								</div>
								<div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-800/30">
									<p className="text-sm text-blue-800 dark:text-blue-300">
										<fbt desc="Label for potty hits with urine">Urine</fbt>
									</p>
									<div className="flex items-baseline">
										<p className="text-xl font-bold text-blue-800 dark:text-blue-300">
											{pottyUrine}
										</p>
										{prevMetrics && (
											<ComparisonValue
												current={pottyUrine}
												previous={prevMetrics.pottyUrine}
											/>
										)}
									</div>
								</div>
								<div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-800/30">
									<p className="text-sm text-blue-800 dark:text-blue-300">
										<fbt desc="Label for potty hits with stool">Stool</fbt>
									</p>
									<div className="flex items-baseline">
										<p className="text-xl font-bold text-blue-800 dark:text-blue-300">
											{pottyStool}
										</p>
										{prevMetrics && (
											<ComparisonValue
												current={pottyStool}
												previous={prevMetrics.pottyStool}
											/>
										)}
									</div>
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="brands">
						{sortedBrands.length > 0 ? (
							<div className="space-y-3">
								{sortedBrands.map(([brand, stats]) => (
									<div className="flex items-center" key={brand}>
										<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
											<div
												className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full"
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
								<fbt desc="Message shown when no diaper brand data is available">
									No diaper brands recorded.
								</fbt>
							</p>
						)}
					</TabsContent>

					<TabsContent value="leakage">
						{leakageBrands.length > 0 ? (
							<div className="space-y-4">
								<p className="text-sm text-muted-foreground">
									<fbt desc="Title for the list of diaper brands sorted by leakage frequency">
										Diaper brands by leakage frequency (min. 3 uses)
									</fbt>
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
														className={`text-sm ${leakagePercent > 20 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground'}`}
													>
														{leakagePercent}% ausgelaufen
													</span>
												</div>
												<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
													<div
														className={`h-3 rounded-full ${leakagePercent > 20 ? 'bg-red-500 dark:bg-red-600' : 'bg-amber-500 dark:bg-amber-600'}`}
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
								<fbt desc="Message shown when not enough data is available for leakage statistics">
									Not enough data for leakage statistics.
								</fbt>
							</p>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
