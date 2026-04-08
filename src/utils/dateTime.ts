type DateInput = Date | string | number;

const asDate = (value: DateInput): Date | null => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const safeToLocaleString = (
  value: DateInput,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const date = asDate(value);
  if (!date) return '--';

  try {
    return date.toLocaleString(locale, options);
  } catch {
    try {
      const { timeZone: _ignore, ...fallbackOptions } = options || {};
      return date.toLocaleString(locale, fallbackOptions);
    } catch {
      return date.toISOString();
    }
  }
};

export const safeToLocaleDateString = (
  value: DateInput,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const date = asDate(value);
  if (!date) return '--';

  try {
    return date.toLocaleDateString(locale, options);
  } catch {
    try {
      const { timeZone: _ignore, ...fallbackOptions } = options || {};
      return date.toLocaleDateString(locale, fallbackOptions);
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }
};

