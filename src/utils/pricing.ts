import {
  BASE_FARE,
  FUEL_LEVELS,
  FUEL_MIN,
  FULL_RANGE_KM,
  NIGHT_MULTIPLIER,
  PER_KM,
  TAX,
  findSector,
} from '@/data/config';
import type { Estimate, FuelCheck, RideForm, Sector } from '@/types/ride';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Distance à vol d'oiseau × 1,35 pour approcher la distance par la route (ponts inclus). */
export function roadKm(a?: Sector, b?: Sector): number {
  if (!a || !b) return 0;
  if (a.id === b.id) return 4; // trajet dans le même secteur

  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;

  return Math.max(3, Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.35));
}

export function isNight(date: Date): boolean {
  const h = date.getHours();
  return h >= 22 || h < 6;
}

export function estimate(form: RideForm, now: Date = new Date()): Estimate {
  const a = findSector(form.pickupSector);
  const b = findSector(form.destSector);
  const km = roadKm(a, b);
  const night = isNight(now);
  const price = round2((BASE_FARE + PER_KM * km) * (night ? NIGHT_MULTIPLIER : 1));
  const tax = TAX[a?.province ?? 'ON'];
  const taxAmount = round2(price * tax.rate);
  const crossing = Boolean(a && b && a.province !== b.province); // rivière des Outaouais

  return {
    km,
    night,
    crossing,
    price,
    taxLabel: tax.label,
    taxAmount,
    total: round2(price + taxAmount),
    minutes: Math.round(km * 1.6 + 6 + (crossing ? 4 : 0)),
  };
}

export function fuelCheck(level: string, km: number): FuelCheck {
  const lv = FUEL_LEVELS.find((x) => x.value === level);
  if (!lv) return { ok: false, message: '' };

  const range = Math.round(lv.fraction * FULL_RANGE_KM);
  const need = Math.round(km * 1.3 + 20);

  if (lv.fraction < FUEL_MIN) {
    return {
      ok: false,
      message:
        'Niveau trop bas : il faut au minimum 1/4 de réservoir (ou 25 % de batterie). Faites le plein avant de commander.',
    };
  }
  if (range < need) {
    return {
      ok: false,
      message: `Autonomie estimée ${range} km, insuffisante pour ce trajet (${need} km nécessaires avec la marge).`,
    };
  }
  return {
    ok: true,
    message: `Carburant suffisant : environ ${range} km d'autonomie pour ${km} km de trajet.`,
  };
}

export function fuelLabel(level: string): string {
  return FUEL_LEVELS.find((x) => x.value === level)?.label ?? '?';
}

export function money(n: number): string {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}

export function initials(name: string): string {
  const words = name.match(/\p{L}+/gu) ?? ['?'];
  return words
    .map((w) => w[0].toUpperCase())
    .join('')
    .slice(0, 2);
}
