'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { differenceInDays, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/i18n-context';
import { Currency, useCurrency } from '@/hooks/use-currency';
import ComparisonValue from './comparison-value';

interface DiaperStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
	products: DiaperProduct[];
}

function formatCurrency(value: number, currency: Currency, locale: string) {
	return new Intl.NumberFormat(locale.replace('_', '-'), {
		currency,
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: 'currency',
	}).format(value);
}

function createProductCostById(products: DiaperProduct[]) {
	return new Map(
		products
			.filter(
				(product) =>
					typeof product.costPerDiaper === 'number' &&
					Number.isFinite(product.costPerDiaper),
			)
			.map((product) => [product.id, product.costPerDiaper as number]),
	);
}

function createProductById(products: DiaperProduct[]) {
	return new Map(products.map((product) => [product.id, product]));
}

function calculateDiaperMetrics(
	diaperChanges: DiaperChange[],
	productCostById: Map<string, number>,
) {
	if (diaperChanges.length === 0) {
		return {
			changesPerDay: '0',
			currentStreak: 0,
			longestStreak: 0,
			longestStreakEndTimestamp: undefined as string | undefined,
			pottyStool: 0,
			pottyUrine: 0,
			totalChanges: 0,
			totalCost: 0,
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

	let totalCost = 0;
	for (const change of diaperChanges) {
		const productId = change.diaperProductId;
		if (!productId) {
			continue;
		}

		const productCost = productCostById.get(productId);
		if (typeof productCost !== 'number') {
			continue;
		}

		totalCost += productCost;
	}

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

	const sortedChanges = [...diaperChanges].sort((a, b) =>
		a.timestamp.localeCompare(b.timestamp),
	);

	let currentStreak = 0;
	let longestStreak = 0;
	let longestStreakEndTimestamp: string | undefined;

	for (const change of sortedChanges) {
		const isSuccess =
			(change.pottyUrine || change.pottyStool) &&
			!change.containsUrine &&
			!change.containsStool;
		const isAccident = change.containsUrine || change.containsStool;

		if (isSuccess) {
			currentStreak++;
			if (currentStreak >= longestStreak) {
				longestStreak = currentStreak;
				longestStreakEndTimestamp = change.timestamp;
			}
		} else if (isAccident) {
			currentStreak = 0;
		}
	}

	return {
		changesPerDay,
		currentStreak,
		longestStreak,
		longestStreakEndTimestamp,
		pottyStool,
		pottyUrine,
		totalChanges,
		totalCost,
		totalPottyHits,
		urineOnly,
		withLeakage,
		withStool,
	};
}

export default function DiaperStats({
	comparisonDiaperChanges,
	diaperChanges = [],
	products = [],
}: DiaperStatsProps) {
	const [currency] = useCurrency();
	const { locale } = useLanguage();

	if (diaperChanges.length === 0) {
		return (
			<Card className="w-full">
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

	const productCostById = createProductCostById(products);
	const productById = createProductById(products);

	const metrics = calculateDiaperMetrics(diaperChanges, productCostById);
	const prevMetrics = comparisonDiaperChanges
		? calculateDiaperMetrics(comparisonDiaperChanges, productCostById)
		: null;

	const {
		changesPerDay,
		currentStreak,
		longestStreak,
		longestStreakEndTimestamp,
		pottyStool,
		pottyUrine,
		totalChanges,
		totalCost,
		totalPottyHits,
		urineOnly,
		withLeakage,
		withStool,
	} = metrics;

	const brandCounts: Record<
		string,
		{ costedChanges: number; leakage: number; total: number; totalCost: number }
	> = {};
	diaperChanges.forEach((change) => {
		const productId = change.diaperProductId;
		if (!productId) {
			return;
		}

		const product = productById.get(productId);
		const productName = product ? product.name : productId;
		if (!brandCounts[productName]) {
			brandCounts[productName] = {
				costedChanges: 0,
				leakage: 0,
				total: 0,
				totalCost: 0,
			};
		}

		brandCounts[productName].total++;

		const productCost = productCostById.get(productId);
		if (typeof productCost === 'number') {
			brandCounts[productName].totalCost += productCost;
			brandCounts[productName].costedChanges += 1;
		}

		if (change.leakage) {
			brandCounts[productName].leakage++;
		}
	});

	const sortedBrands = Object.entries(brandCounts)
		.sort(([, countA], [, countB]) => countB.total - countA.total)
		.slice(0, 5);

	return (
		<Card className="w-full">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the diaper statistics card">
						Diaper Statistics
					</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<Tabs className="w-full" defaultValue="overview">
					<TabsList className="grid grid-cols-2 mb-4 w-full">
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
							<div className="border rounded-md p-3 col-span-2">
								<p className="text-sm text-muted-foreground">
									<fbt desc="Label for the diaper costs in the selected time range">
										Cost
									</fbt>
								</p>
								<div className="flex items-baseline">
									<p className="text-2xl font-bold">
										{formatCurrency(totalCost, currency, locale)}
									</p>
									{prevMetrics && (
										<ComparisonValue
											current={totalCost}
											previous={prevMetrics.totalCost}
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

						<div className="space-y-2">
							<h4 className="text-sm font-semibold">
								<fbt desc="Title for the potty streaks section in diaper statistics">
									Potty Streaks
								</fbt>
							</h4>
							<div className="grid grid-cols-2 gap-4">
								<div className="border rounded-md p-3 bg-green-50 dark:bg-green-800/30">
									<p className="text-sm text-green-800 dark:text-green-300">
										<fbt desc="Label for current potty streak">Current</fbt>
									</p>
									<div className="flex items-baseline">
										<p className="text-xl font-bold text-green-800 dark:text-green-300">
											{currentStreak}
										</p>
										{prevMetrics && (
											<ComparisonValue
												current={currentStreak}
												previous={prevMetrics.currentStreak}
											/>
										)}
									</div>
								</div>
								<div className="border rounded-md p-3 bg-green-50 dark:bg-green-800/30">
									<p className="text-sm text-green-800 dark:text-green-300">
										<fbt desc="Label for longest potty streak">Longest</fbt>
									</p>
									<div className="flex items-baseline">
										<p className="text-xl font-bold text-green-800 dark:text-green-300">
											{longestStreak}
										</p>
										{prevMetrics && (
											<ComparisonValue
												current={longestStreak}
												previous={prevMetrics.longestStreak}
											/>
										)}
									</div>
									{longestStreakEndTimestamp && (
										<p className="text-[10px] text-green-600 dark:text-green-400 mt-1">
											{format(new Date(longestStreakEndTimestamp), 'PP')}
										</p>
									)}
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="brands">
						{sortedBrands.length > 0 ? (
							<div className="space-y-3">
								{sortedBrands.map(([brand, stats]) => {
									const brandSharePercent = (stats.total / totalChanges) * 100;
									const leakagePercentWithinBrand =
										stats.total > 0 ? (stats.leakage / stats.total) * 100 : 0;
									const safeLeakagePercent = Math.max(
										0,
										Math.min(100, leakagePercentWithinBrand),
									);
									const nonLeakagePercent = 100 - safeLeakagePercent;

									return (
										<div className="flex items-center" key={brand}>
											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
												<div
													className="h-4 rounded-full flex"
													style={{ width: `${brandSharePercent}%` }}
												>
													<div
														className="bg-red-500 dark:bg-red-600 h-4"
														style={{ width: `${safeLeakagePercent}%` }}
													/>
													<div
														className="bg-blue-600 dark:bg-blue-500 h-4"
														style={{ width: `${nonLeakagePercent}%` }}
													/>
												</div>
											</div>
											<div className="ml-3 min-w-[170px]">
												<p className="text-sm font-medium">{brand}</p>
												<p className="text-xs text-muted-foreground">
													{stats.total} ({Math.round(brandSharePercent)}%)
												</p>
												<p className="text-xs text-muted-foreground">
													<fbt desc="Leakage rate per diaper brand in diaper statistics">
														Leaked:{' '}
														<fbt:param name="leakageCount">
															{stats.leakage}
														</fbt:param>
														/{' '}
														<fbt:param name="totalCount">
															{stats.total}
														</fbt:param>{' '}
														(
														<fbt:param name="leakagePercent">
															{Math.round(safeLeakagePercent)}
														</fbt:param>
														%)
													</fbt>
												</p>
												{stats.costedChanges > 0 ? (
													<p className="text-xs text-muted-foreground">
														<fbt desc="Per diaper brand cost summary in diaper statistics">
															Cost:{' '}
															<fbt:param name="cost">
																{formatCurrency(
																	stats.totalCost,
																	currency,
																	locale,
																)}
															</fbt:param>
														</fbt>
													</p>
												) : (
													<p className="text-xs text-muted-foreground">
														<fbt desc="Missing cost configuration message for diaper brand statistics">
															Cost not configured
														</fbt>
													</p>
												)}
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<p className="text-muted-foreground text-center py-4">
								<fbt desc="Message shown when no diaper brand data is available">
									No diaper brands recorded.
								</fbt>
							</p>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
