export const isDate = (value: any): value is Date => {
	return value instanceof Date;
};

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

export const isDateString = (value: any): value is string => {
	return typeof value === 'string' && isoDateRegex.test(value);
};
