export const colors = {
  bg: '#F5F8FF',
  surface: '#FFFFFF',
  surfaceSoft: '#EAF2FF',
  surfaceBorder: '#D6E4FF',
  primary: '#2563EB',
  primaryDark: '#1E3A8A',
  primaryMid: '#1D4ED8',
  text: '#0F172A',
  textMuted: '#475569',
  textSoft: '#64748B',
  white: '#FFFFFF',
  warning: '#F59E0B',
  success: '#166534',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 } as const,
    elevation: 2,
  },
  md: {
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 } as const,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 } as const,
    elevation: 6,
  },
} as const;
