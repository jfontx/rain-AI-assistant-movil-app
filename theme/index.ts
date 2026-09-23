/**
 * Design Tokens extraídos de Google Stitch (Calm Rain Assistant)
 */

export const theme = {
  colors: {
    // Primary & Secondary
    primary: '#4140d1',
    primaryContainer: '#5b5ceb',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#f5f2ff',
    secondary: '#4648d4',
    secondaryContainer: '#6063ee',
    onSecondary: '#ffffff',
    
    // Canvas & Surfaces
    background: '#f8f9ff', // Base mist
    surface: '#ffffff', // Interactive Cards & Panels
    surfaceVariant: '#f1f5f9', // Subtle fog for nested segments
    
    // Text & Content
    onSurface: '#0f172a', // Deep slate
    onSurfaceVariant: '#64748b', // Slate balance
    outline: '#94a3b8', // Mist slate
    
    // Tertiary & Urgency
    tertiary: '#f59e0b', // Soft amber
    error: '#f43f5e', // Soft coral
  },
  typography: {
    fontFamily: {
      regular: 'PlusJakartaSans_400Regular',
      medium: 'PlusJakartaSans_500Medium',
      semiBold: 'PlusJakartaSans_600SemiBold',
      bold: 'PlusJakartaSans_700Bold',
    },
    display: {
      fontSize: 34,
      lineHeight: 42,
      letterSpacing: -0.68, // -0.02em
    },
    headlineLg: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.36, // -0.015em
    },
    headlineMd: {
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.2, // -0.01em
    },
    headlineSm: {
      fontSize: 18,
      lineHeight: 26,
    },
    bodyLg: {
      fontSize: 16,
      lineHeight: 26,
    },
    bodyMd: {
      fontSize: 14,
      lineHeight: 22,
    },
    bodySm: {
      fontSize: 13,
      lineHeight: 18,
    },
    labelLg: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.14, // 0.01em
    },
    labelMd: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.24, // 0.02em
    },
  },
  spacing: {
    xs: 4,     // 0.25rem
    sm: 8,     // 0.5rem
    md: 16,    // 1rem
    lg: 24,    // 1.5rem
    xl: 32,    // 2rem
    xxl: 48,   // 3rem
    gutter: 12, // 0.75rem mobile gutter
    margin: 20, // 1.25rem mobile margin
  },
  roundness: {
    sm: 8,
    md: 12,
    lg: 16,  // rounded-2xl
    xl: 24,  // rounded-3xl
    full: 9999,
  },
  shadows: {
    level1: {
      shadowColor: '#3B3CEB', // tint primary 5b5ceb
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2, // Android fallback
    },
    level2: {
      shadowColor: '#3B3CEB',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 6,
    },
    level3: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 12,
    }
  }
};
