export function formatCurrency(amount: number, currency = 'USD') {
  if (isNaN(amount as any)) return '-';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

// The backend sends/accepts invoiceDate and dueDate as plain calendar dates ("yyyy-MM-dd"), with
// no time-of-day or timezone component — they are dates a user picked, not instants. This must
// never route the string through `new Date(str)` for parsing: JS treats a bare date string as UTC
// midnight, and reading it back via local-timezone accessors (getFullYear/toLocaleDateString
// without an explicit UTC anchor) reintroduces exactly the one-day drift this format was chosen to
// eliminate. formatDate anchors to UTC on both the parse and the display side so the same instant
// is used throughout — no local timezone ever enters the calculation.
export function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;
  const [, year, month, day] = match;
  const monthIndex = Number(month) - 1;
  const dayNumber = Number(day);
  // Date.UTC() normalizes out-of-range components instead of failing, so a plain isNaN check on
  // its result can never catch a malformed value here — validate the ranges directly.
  if (monthIndex < 0 || monthIndex > 11 || dayNumber < 1 || dayNumber > 31) return dateStr;
  const utcMidnight = new Date(Date.UTC(Number(year), monthIndex, dayNumber));
  return utcMidnight.toLocaleDateString(undefined, { timeZone: 'UTC' });
}

export function toNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}
