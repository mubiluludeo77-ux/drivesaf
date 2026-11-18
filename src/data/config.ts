import type { Driver, FuelLevel, LicenceCode, Province, Sector } from '@/types/ride';

// ------------------------------------------------------------
// Tarifs (dollars canadiens)
// ------------------------------------------------------------
export const BASE_FARE = 25;
export const PER_KM = 2.1;
export const NIGHT_MULTIPLIER = 1.2; // de 22 h à 6 h
export const DRIVER_SHARE = 0.8; // part du chauffeur, avant taxes

// Taxes selon la province de départ (à valider avec un comptable)
export const TAX: Record<Province, { rate: number; label: string }> = {
  ON: { rate: 0.13, label: 'TVH 13 %' },
  QC: { rate: 0.14975, label: 'TPS + TVQ 14,975 %' },
};

// ------------------------------------------------------------
// Permis : minimum G2 (Ontario) ou classe 5 probatoire (Québec)
// ------------------------------------------------------------
export const LICENCES: Record<LicenceCode, string> = {
  '': 'Choisir…',
  G1: 'Ontario – G1 (apprenti)',
  G2: 'Ontario – G2',
  G: 'Ontario – G (complet)',
  QCA: 'Québec – classe 5 apprenti',
  QCP: 'Québec – classe 5 probatoire',
  QC5: 'Québec – classe 5',
};

export const LICENCE_SHORT: Partial<Record<LicenceCode, string>> = {
  G2: 'G2 (ON)',
  G: 'G (ON)',
  QCP: 'classe 5 probatoire (QC)',
  QC5: 'classe 5 (QC)',
};

const ACCEPTED_LICENCES: LicenceCode[] = ['G2', 'G', 'QCP', 'QC5'];

export function licenceOk(code: LicenceCode): boolean {
  return ACCEPTED_LICENCES.includes(code);
}

// ------------------------------------------------------------
// Zone de service : Ottawa–Gatineau (centre approximatif des secteurs)
// ------------------------------------------------------------
export const SECTORS: Sector[] = [
  { id: 'byward', name: 'Centre-ville / Marché By', province: 'ON', lat: 45.426, lon: -75.693 },
  { id: 'glebe', name: 'Glebe / Vieil Ottawa-Sud', province: 'ON', lat: 45.4, lon: -75.687 },
  { id: 'vanier', name: 'Vanier / Overbrook', province: 'ON', lat: 45.437, lon: -75.663 },
  { id: 'westboro', name: 'Westboro / Hintonburg', province: 'ON', lat: 45.391, lon: -75.755 },
  { id: 'nepean', name: 'Nepean', province: 'ON', lat: 45.334, lon: -75.724 },
  { id: 'barrhaven', name: 'Barrhaven', province: 'ON', lat: 45.275, lon: -75.74 },
  { id: 'kanata', name: 'Kanata', province: 'ON', lat: 45.309, lon: -75.913 },
  { id: 'orleans', name: 'Orléans', province: 'ON', lat: 45.469, lon: -75.517 },
  { id: 'gloucester', name: 'Gloucester / South Keys', province: 'ON', lat: 45.36, lon: -75.65 },
  { id: 'hull', name: 'Hull (centre-ville)', province: 'QC', lat: 45.428, lon: -75.713 },
  { id: 'plateau', name: 'Plateau / Mont-Bleu', province: 'QC', lat: 45.447, lon: -75.765 },
  { id: 'aylmer', name: 'Aylmer', province: 'QC', lat: 45.395, lon: -75.84 },
  { id: 'gatineau', name: 'Gatineau (secteur)', province: 'QC', lat: 45.486, lon: -75.65 },
  { id: 'masson', name: 'Masson-Angers', province: 'QC', lat: 45.54, lon: -75.42 },
  { id: 'buckingham', name: 'Buckingham', province: 'QC', lat: 45.588, lon: -75.418 },
];

export function findSector(id: string): Sector | undefined {
  return SECTORS.find((s) => s.id === id);
}

// ------------------------------------------------------------
// Carburant : minimum 1/4 de réservoir (ou 25 % de batterie).
// Le chauffeur n'avance pas d'argent pour le plein et ne risque pas la
// panne sèche. L'autonomie doit aussi couvrir distance × 1,3 + 20 km.
// ------------------------------------------------------------
export const FUEL_LEVELS: FuelLevel[] = [
  { value: 'reserve', label: 'Réserve (voyant allumé)', fraction: 0.08 },
  { value: 'q1', label: '1/4 (25 %)', fraction: 0.25 },
  { value: 'q2', label: '1/2 (50 %)', fraction: 0.5 },
  { value: 'q3', label: '3/4 (75 %)', fraction: 0.75 },
  { value: 'full', label: 'Plein (100 %)', fraction: 1 },
];
export const FUEL_MIN = 0.25;
export const FULL_RANGE_KM = 500; // autonomie prudente d'un plein

export const REASONS = ["J'ai bu de l'alcool", 'Fatigue', 'Médicaments', 'Blessure', 'Autre'];

// ------------------------------------------------------------
// Démo : chauffeurs simulés et durées des animations
// ------------------------------------------------------------
export const DEMO_DRIVERS: Driver[] = [
  { name: 'Karim B.', rating: 4.92, trips: 1284, licence: 'G' },
  { name: 'Sophie L.', rating: 4.88, trips: 731, licence: 'QC5' },
  { name: 'Julien M.', rating: 4.97, trips: 2210, licence: 'G2' },
  { name: 'Awa D.', rating: 4.95, trips: 948, licence: 'QCP' },
];

export const ENROUTE_MS = 9000;
export const TRIP_MS = 12000;
export const AUTO_ACCEPT_MS = 2500;
