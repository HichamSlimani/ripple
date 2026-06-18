// Shared instability vocabulary. Coral is RESERVED for high instability; mint
// (phosphor) reads as a contained, settled cascade.
export function instabilityColor(v: number): string {
  if (v >= 67) return 'rgb(var(--coral-rgb))';
  if (v >= 34) return 'rgb(var(--amber-rgb))';
  return 'rgb(var(--phosphor-rgb))';
}

export function instabilityBand(v: number): string {
  if (v >= 84) return 'SYSTEMIC UPHEAVAL';
  if (v >= 67) return 'DESTABILISING';
  if (v >= 34) return 'TURBULENT';
  if (v >= 15) return 'PERTURBED';
  return 'CONTAINED';
}

export const DOMAIN_TINT: Record<string, string> = {
  ECONOMY: '#66ffc2',
  SOCIETY: '#8fd0ff',
  TECHNOLOGY: '#b69bff',
  ENVIRONMENT: '#7be8a3',
  POLITICS: '#ffc970',
  CULTURE: '#ff9ecb',
  HEALTH: '#7ef0e0',
  SECURITY: '#ff6a5a',
};

export function domainTint(d: string): string {
  return DOMAIN_TINT[d] ?? '#8eb2a8';
}
