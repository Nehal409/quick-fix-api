export const Colors = {
  primary: '#1A73E8',
  success: '#34A853',
  warning: '#FBBC04',
  danger: '#EA4335',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#202124',
  muted: '#5F6368',
} as const;

export const Fonts = {
  latin: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    bold: 'Inter-Bold',
  },
  urdu: {
    regular: 'NotoNastaliqUrdu-Regular',
  },
} as const;

export const Spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  card: 12,
  bubble: 18,
  sm: 8,
  full: 999,
} as const;
