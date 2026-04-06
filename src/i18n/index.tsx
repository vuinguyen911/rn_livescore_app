import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Locale, translations } from './translations';

type Dictionary = (typeof translations)[Locale];
export type TimeZoneOption = 'Asia/Ho_Chi_Minh' | 'Asia/Tokyo';
const TIMEZONE_KEY = 'timezone_option_v1';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  timeZone: TimeZoneOption;
  setTimeZone: (timeZone: TimeZoneOption) => void;
  t: Dictionary;
  dateLocale: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('vi');
  const [timeZone, setTimeZoneState] = useState<TimeZoneOption>('Asia/Ho_Chi_Minh');

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(TIMEZONE_KEY);
        if (raw === 'Asia/Ho_Chi_Minh' || raw === 'Asia/Tokyo') {
          setTimeZoneState(raw);
        }
      } catch {
        // noop
      }
    };
    void load();
  }, []);

  const setTimeZone = (next: TimeZoneOption) => {
    setTimeZoneState(next);
    void AsyncStorage.setItem(TIMEZONE_KEY, next);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      timeZone,
      setTimeZone,
      t: translations[locale],
      dateLocale: locale === 'vi' ? 'vi-VN' : 'en-US',
    }),
    [locale, timeZone],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
};
