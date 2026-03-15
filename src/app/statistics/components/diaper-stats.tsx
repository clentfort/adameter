'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { differenceInDays } from 'date-fns';
import PieChart from '@/components/charts/pie-chart';
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

const BRAND_COLORS = [
	'#3b82f6', // blue-500
	'#10b981', // emerald-500
	'#f59e0b', // amber-500
	'#8b5cf6', // violet-500
	'#f43f5e', // rose-500
];

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
			totalChanges: 0,
			totalCost: 0,
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

	return {
		changesPerDay,
		totalChanges,
		totalCost,
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
		totalChanges,
		totalCost,
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

	const pieData = {
		datasets: [
			{
				backgroundColor: BRAND_COLORS,
				data: sortedBrands.map(([, stats]) => stats.total),
				label: 'Diaper Brands',
			},
		],
		labels: sortedBrands.map(([brand]) => brand),
	};

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
					</TabsContent>

					<TabsContent className="space-y-6" value="brands">
						{sortedBrands.length > 0 ? (
							<>
								<div className="flex justify-center">
									<PieChart
										datasets={pieData.datasets}
										emptyStateMessage={
											<fbt desc="Empty state message for diaper brand chart">
												No brand data available
											</fbt>
										}
										labels={pieData.labels}
									/>
								</div>
								<div className="space-y-4">
									{sortedBrands.map(([brand, stats], index) => {
										const brandSharePercent =
											(stats.total / totalChanges) * 100;
										const leakagePercentWithinBrand =
											stats.total > 0 ? (stats.leakage / stats.total) * 100 : 0;

										return (
											<div className="border-t pt-4" key={brand}>
												<div className="flex items-center gap-2 mb-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{
															backgroundColor:
																BRAND_COLORS[index % BRAND_COLORS.length],
														}}
													/>
													<p className="text-sm font-semibold">{brand}</p>
													<div className="flex items-center gap-4 ml-auto">
														<span className="text-xs text-muted-foreground">
															{stats.total}{' '}
															<fbt desc="Label for brand change count">
																changes
															</fbt>{' '}
															({Math.round(brandSharePercent)}%)
														</span>
													</div>
												</div>
												<div className="grid grid-cols-2 gap-4">
													<div>
														<p className="text-xs text-muted-foreground">
															<fbt desc="Label for brand leakage rate">
																Leakage Rate
															</fbt>
														</p>
														<p className="text-sm font-medium">
															{Math.round(leakagePercentWithinBrand)}%
															<span className="text-[10px] text-muted-foreground ml-1">
																({stats.leakage}{' '}
																<fbt desc="Label for brand leak count">
																	leaks
																</fbt>
																)
															</span>
														</p>
													</div>
													<div>
														<p className="text-xs text-muted-foreground">
															<fbt desc="Label for total brand cost">
																Total Cost
															</fbt>
														</p>
														<p className="text-sm font-medium">
															{stats.costedChanges > 0 ? (
																formatCurrency(
																	stats.totalCost,
																	currency,
																	locale,
																)
															) : (
																<span className="text-muted-foreground italic">
																	<fbt desc="Label for missing brand cost">
																		Not configured
																	</fbt>
																</span>
															)}
														</p>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</>
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
