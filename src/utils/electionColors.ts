import type { ThermometerLevel } from '../types/election';

/**
 * Níveis do termômetro de votação:
 * Cidades com 0 votos recebem tratamento visual neutro,
 * e cidades com 1+ votos progridem do ciano suave ao ouro/rubi flamejante.
 */
export const THERMOMETER_LEVELS: ThermometerLevel[] = [
  {
    id: 'zero',
    label: '0 votos',
    rangeLabel: '0 votos',
    min: 0,
    max: 0,
    color: '#475569',
    glowColor: 'rgba(71, 85, 105, 0.4)',
    textColor: '#94a3b8',
  },
  {
    id: 'low',
    label: '1 a 10',
    rangeLabel: '1 a 10 votos',
    min: 1,
    max: 10,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.55)',
    textColor: '#a5f3fc',
  },
  {
    id: 'medium_low',
    label: '11 a 50',
    rangeLabel: '11 a 50 votos',
    min: 11,
    max: 50,
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.65)',
    textColor: '#6ee7b7',
  },
  {
    id: 'medium',
    label: '51 a 150',
    rangeLabel: '51 a 150 votos',
    min: 51,
    max: 150,
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.75)',
    textColor: '#fde047',
  },
  {
    id: 'high',
    label: '151 a 500',
    rangeLabel: '151 a 500 votos',
    min: 151,
    max: 500,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.85)',
    textColor: '#fdba74',
  },
  {
    id: 'top',
    label: '500+',
    rangeLabel: 'Mais de 500 votos',
    min: 501,
    max: Infinity,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.95)',
    textColor: '#fca5a5',
  },
];

/**
 * Retorna as propriedades visuais de cor do termômetro para um determinado número de votos
 */
export function getVoteColorConfig(votos: number): ThermometerLevel {
  if (votos <= 0) {
    return THERMOMETER_LEVELS[0];
  }
  for (let i = 1; i < THERMOMETER_LEVELS.length; i++) {
    const lvl = THERMOMETER_LEVELS[i];
    if (votos >= lvl.min && votos <= lvl.max) {
      return lvl;
    }
  }
  return THERMOMETER_LEVELS[THERMOMETER_LEVELS.length - 1];
}

/**
 * Calcula o raio do círculo do marcador no mapa Leaflet de forma logarítmica / balanceada,
 * garantindo visibilidade clara tanto no desktop quanto em telas móveis.
 */
export function getMarkerRadius(votos: number): number {
  if (votos <= 0) {
    return 6;
  }
  if (votos <= 10) {
    return 9;
  }
  if (votos <= 50) {
    return 13;
  }
  if (votos <= 150) {
    return 17;
  }
  if (votos <= 500) {
    return 22;
  }
  // Para cidades gigantescas como Colatina (>2.000 votos)
  return 28;
}

/**
 * Formata números no padrão brasileiro (ex: 2026 -> "2.026")
 */
export function formatVotesBR(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata percentual no padrão brasileiro (ex: 3.2 -> "3,20%")
 */
export function formatPercentBR(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`;
}
