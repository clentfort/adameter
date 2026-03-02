import { Queries } from 'tinybase';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

export const defineStatisticsQueries = (queries: Queries) => {
	queries.setQueryDefinition(
		'filteredFeedingSessions',
		TABLE_IDS.FEEDING_SESSIONS,
		({ select, where, param }) => {
			select('startTime');
			select('endTime');
			select('breast');
			select('durationInSeconds');
			where((getTableCell) => {
				const from = param('from') as string | undefined;
				const to = param('to') as string | undefined;
				const startTime = getTableCell('startTime') as string;
				return (!from || startTime >= from) && (!to || startTime <= to);
			});
		},
	);

	queries.setQueryDefinition(
		'comparisonFeedingSessions',
		TABLE_IDS.FEEDING_SESSIONS,
		({ select, where, param }) => {
			select('startTime');
			select('endTime');
			select('breast');
			select('durationInSeconds');
			where((getTableCell) => {
				const from = param('from') as string | undefined;
				const to = param('to') as string | undefined;
				const startTime = getTableCell('startTime') as string;
				return (!from || startTime >= from) && (!to || startTime <= to);
			});
		},
	);

	queries.setQueryDefinition(
		'filteredDiaperChanges',
		TABLE_IDS.DIAPER_CHANGES,
		({ select, where, param }) => {
			select('timestamp');
			select('containsUrine');
			select('containsStool');
			select('pottyUrine');
			select('pottyStool');
			select('leakage');
			select('diaperProductId');
			where((getTableCell) => {
				const from = param('from') as string | undefined;
				const to = param('to') as string | undefined;
				const timestamp = getTableCell('timestamp') as string;
				return (!from || timestamp >= from) && (!to || timestamp <= to);
			});
		},
	);

	queries.setQueryDefinition(
		'comparisonDiaperChanges',
		TABLE_IDS.DIAPER_CHANGES,
		({ select, where, param }) => {
			select('timestamp');
			select('containsUrine');
			select('containsStool');
			select('pottyUrine');
			select('pottyStool');
			select('leakage');
			select('diaperProductId');
			where((getTableCell) => {
				const from = param('from') as string | undefined;
				const to = param('to') as string | undefined;
				const timestamp = getTableCell('timestamp') as string;
				return (!from || timestamp >= from) && (!to || timestamp <= to);
			});
		},
	);

	queries.setQueryDefinition(
		'feedingHistory',
		TABLE_IDS.FEEDING_SESSIONS,
		({ select }) => {
			select('startTime');
		},
	);

	queries.setQueryDefinition(
		'diaperHistory',
		TABLE_IDS.DIAPER_CHANGES,
		({ select }) => {
			select('timestamp');
		},
	);
};
