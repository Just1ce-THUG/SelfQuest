export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F5',
  text: '#101318',
  textMuted: '#667085',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  border: '#D9DEE7',
  success: '#16A34A',
  danger: '#DC2626',
} as const;

export type ColorToken = keyof typeof colors;
