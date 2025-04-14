export function isAbnormalTemperature(temp: number) {
	return temp < 36.5 || temp > 37.5;
}
