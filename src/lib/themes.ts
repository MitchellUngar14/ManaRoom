// Battlefield Theme Definitions for ManaRoom

export interface BattlefieldTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    accent: string;
    accentGlow: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
  effects: {
    ambientEnabled: boolean;
    ambientType: 'particles' | 'rain' | 'fire' | 'embers' | 'stars' | 'petals' | 'none';
    ambientColor: string;
    ambientOpacity: number;
  };
  gradient?: {
    enabled: boolean;
    from: string;
    to: string;
    direction: string;
  };
}

export const themes: Record<string, BattlefieldTheme> = {
  'classic-arena': {
    id: 'classic-arena',
    name: 'Classic',
    description: 'Timeless tournament feel with clean dark panels',
    colors: {
      bgPrimary: '#1a1a1a',
      bgSecondary: '#252525',
      bgTertiary: '#2a2a2a',
      accent: '#c9a227',
      accentGlow: 'rgba(201, 162, 39, 0.3)',
      textPrimary: '#e8e8f0',
      textSecondary: '#9ca3af',
      border: '#3a3a3a',
    },
    effects: {
      ambientEnabled: false,
      ambientType: 'none',
      ambientColor: 'transparent',
      ambientOpacity: 0,
    },
  },

  'dominaria-sunset': {
    id: 'dominaria-sunset',
    name: 'Dominaria',
    description: 'Warm nostalgic vibes of the home plane',
    colors: {
      bgPrimary: '#2d1810',
      bgSecondary: '#3d2820',
      bgTertiary: '#4d3830',
      accent: '#d97706',
      accentGlow: 'rgba(217, 119, 6, 0.3)',
      textPrimary: '#fef3c7',
      textSecondary: '#d6d3d1',
      border: '#78350f',
    },
    effects: {
      ambientEnabled: true,
      ambientType: 'embers',
      ambientColor: '#f97316',
      ambientOpacity: 0.4,
    },
    gradient: {
      enabled: true,
      from: '#2d1810',
      to: '#4c1d95',
      direction: 'to bottom',
    },
  },

  'phyrexian-corruption': {
    id: 'phyrexian-corruption',
    name: 'Phyrexia',
    description: 'Dark biomechanical horror with toxic green',
    colors: {
      bgPrimary: '#0a0a0a',
      bgSecondary: '#0f1a0f',
      bgTertiary: '#1a2a1a',
      accent: '#22c55e',
      accentGlow: 'rgba(34, 197, 94, 0.4)',
      textPrimary: '#d1fae5',
      textSecondary: '#86efac',
      border: '#166534',
    },
    effects: {
      ambientEnabled: true,
      ambientType: 'particles',
      ambientColor: '#22c55e',
      ambientOpacity: 0.3,
    },
  },

  'ravnica-cityscape': {
    id: 'ravnica-cityscape',
    name: 'Ravnica',
    description: 'Urban fantasy with art deco guild architecture',
    colors: {
      bgPrimary: '#1a1a24',
      bgSecondary: '#252532',
      bgTertiary: '#2a2a3a',
      accent: '#60a5fa',
      accentGlow: 'rgba(96, 165, 250, 0.3)',
      textPrimary: '#e0e7ff',
      textSecondary: '#a5b4fc',
      border: '#374151',
    },
    effects: {
      ambientEnabled: true,
      ambientType: 'rain',
      ambientColor: '#60a5fa',
      ambientOpacity: 0.2,
    },
  },

  'innistrad-manor': {
    id: 'innistrad-manor',
    name: 'Innistrad',
    description: 'Gothic horror with flickering candlelight',
    colors: {
      bgPrimary: '#1a0a0a',
      bgSecondary: '#2a1515',
      bgTertiary: '#3a2020',
      accent: '#dc2626',
      accentGlow: 'rgba(220, 38, 38, 0.3)',
      textPrimary: '#fecaca',
      textSecondary: '#f87171',
      border: '#7f1d1d',
    },
    effects: {
      ambientEnabled: true,
      ambientType: 'fire',
      ambientColor: '#f97316',
      ambientOpacity: 0.3,
    },
  },

  'zendikar-hedron': {
    id: 'zendikar-hedron',
    name: 'Zendikar',
    description: 'Ancient floating stones with crackling energy',
    colors: {
      bgPrimary: '#0c1929',
      bgSecondary: '#1a2a40',
      bgTertiary: '#243a50',
      accent: '#0ea5e9',
      accentGlow: 'rgba(14, 165, 233, 0.4)',
      textPrimary: '#e0f2fe',
      textSecondary: '#7dd3fc',
      border: '#0369a1',
    },
    effects: {
      ambientEnabled: true,
      ambientType: 'particles',
      ambientColor: '#0ea5e9',
      ambientOpacity: 0.5,
    },
  },

  'theros-starfield': {
    id: 'theros-starfield',
    name: 'Theros',
    description: 'Divine constellations in the night sky',
    colors: {
      bgPrimary: '#0a0a1a',
      bgSecondary: '#14142a',
      bgTertiary: '#1e1e3a',
      accent: '#eab308',
      accentGlow: 'rgba(234, 179, 8, 0.3)',
      textPrimary: '#fef9c3',
      textSecondary: '#fde047',
      border: '#4338ca',
    },
    effects: {
      ambientEnabled: true,
      ambientType: 'stars',
      ambientColor: '#fef9c3',
      ambientOpacity: 0.6,
    },
  },

  'kamigawa-neon': {
    id: 'kamigawa-neon',
    name: 'Kamigawa',
    description: 'Cyberpunk shrines with neon circuits',
    colors: {
      bgPrimary: '#0a0a12',
      bgSecondary: '#12121f',
      bgTertiary: '#1a1a2f',
      accent: '#f472b6',
      accentGlow: 'rgba(244, 114, 182, 0.4)',
      textPrimary: '#fdf4ff',
      textSecondary: '#e879f9',
      border: '#7c3aed',
    },
    effects: {
      ambientEnabled: true,
      ambientType: 'petals',
      ambientColor: '#f472b6',
      ambientOpacity: 0.3,
    },
  },

  'eldraine-forest': {
    id: 'eldraine-forest',
    name: 'Eldraine',
    description: 'Dark fairy tale with mystical fog',
    colors: {
      bgPrimary: '#0a1a0a',
      bgSecondary: '#142a14',
      bgTertiary: '#1e3a1e',
      accent: '#a855f7',
      accentGlow: 'rgba(168, 85, 247, 0.3)',
      textPrimary: '#f3e8ff',
      textSecondary: '#c084fc',
      border: '#14532d',
    },
    effects: {
      ambientEnabled: true,
      ambientType: 'particles',
      ambientColor: '#a855f7',
      ambientOpacity: 0.4,
    },
  },

  'amonkhet-pyramid': {
    id: 'amonkhet-pyramid',
    name: 'Amonkhet',
    description: 'Egyptian grandeur with golden sands',
    colors: {
      bgPrimary: '#1a1408',
      bgSecondary: '#2a2418',
      bgTertiary: '#3a3428',
      accent: '#eab308',
      accentGlow: 'rgba(234, 179, 8, 0.4)',
      textPrimary: '#fef3c7',
      textSecondary: '#fcd34d',
      border: '#78350f',
    },
    effects: {
      ambientEnabled: true,
      ambientType: 'particles',
      ambientColor: '#d4a853',
      ambientOpacity: 0.3,
    },
  },
};

export const themeList = Object.values(themes);

export const defaultTheme = themes['classic-arena'];

export function getTheme(id: string): BattlefieldTheme {
  return themes[id] || defaultTheme;
}

// Generate CSS variables from theme
export function themeToCSSVariables(theme: BattlefieldTheme): Record<string, string> {
  return {
    '--theme-bg-primary': theme.colors.bgPrimary,
    '--theme-bg-secondary': theme.colors.bgSecondary,
    '--theme-bg-tertiary': theme.colors.bgTertiary,
    '--theme-accent': theme.colors.accent,
    '--theme-accent-glow': theme.colors.accentGlow,
    '--theme-text-primary': theme.colors.textPrimary,
    '--theme-text-secondary': theme.colors.textSecondary,
    '--theme-border': theme.colors.border,
    '--theme-ambient-opacity': theme.effects.ambientOpacity.toString(),
    '--theme-ambient-color': theme.effects.ambientColor,
  };
}
