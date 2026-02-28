import { parseISO, format } from 'date-fns';

try {
  const date = parseISO(undefined as any);
  console.log('date:', date);
  console.log('time:', date.getTime());
  console.log('format:', format(date, 'yyyy-MM-dd'));
} catch (e) {
  console.error('error:', e);
}
