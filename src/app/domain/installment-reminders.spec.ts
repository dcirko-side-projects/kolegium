import { describe, expect, it } from 'vitest';
import { installmentReminder } from './installment-reminders';

describe('installment reminders', () => {
  it('keeps an unpaid reminder visible through both windows and the due date', () => {
    const row = { dueOn: '2027-01-10', isPaid: false };
    expect(installmentReminder(row, '2026-12-10')).toBeNull();
    expect(installmentReminder(row, '2026-12-11')).toContain('30 dana');
    expect(installmentReminder(row, '2027-01-02')).toContain('30 dana');
    expect(installmentReminder(row, '2027-01-03')).toContain('7 dana');
    expect(installmentReminder(row, '2027-01-10')).toContain('danas');
    expect(installmentReminder(row, '2027-01-11')).toBeNull();
    expect(installmentReminder({ ...row, isPaid: true }, '2027-01-03')).toBeNull();
  });
  it('counts calendar days across Zagreb DST and leap February', () => {
    expect(installmentReminder({ dueOn: '2026-03-30', isPaid: false }, '2026-03-23')).toContain(
      '7 dana',
    );
    expect(installmentReminder({ dueOn: '2028-03-01', isPaid: false }, '2028-01-31')).toContain(
      '30 dana',
    );
  });
});
