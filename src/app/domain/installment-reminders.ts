import { InstallmentInput } from './planning.models';
import { dateOnly } from './academic.validation';

export function installmentReminder(
  row: Pick<InstallmentInput, 'dueOn' | 'isPaid'>,
  today: string,
): string | null {
  const days =
    (Date.parse(dateOnly(row.dueOn) + 'T00:00:00Z') - Date.parse(dateOnly(today) + 'T00:00:00Z')) /
    86400000;
  if (row.isPaid || days < 0 || days > 30) return null;
  if (days === 0) return 'Rok plaćanja je danas.';
  return days <= 7 ? 'Rok plaćanja je u idućih 7 dana.' : 'Rok plaćanja je u idućih 30 dana.';
}
