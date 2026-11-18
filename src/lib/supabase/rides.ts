import { getSupabase } from '@/lib/supabase/client';

// Appels aux fonctions SQL de supabase/migrations/*_functions.sql.
// Le navigateur n'écrit jamais directement dans la table « rides » :
// le serveur calcule le prix et vérifie toutes les règles.

export type RideRow = {
  id: string;
  client_id: string;
  driver_id: string | null;
  vehicle_id: string;
  status: 'searching' | 'enroute' | 'arrived' | 'trip' | 'dropoff' | 'done' | 'cancelled';
  pickup_address: string;
  pickup_sector: string;
  dest_address: string;
  dest_sector: string;
  fuel_level: number;
  distance_km: number;
  price: number;
  tax_label: string;
  tax_amount: number;
  total: number;
  driver_payout: number;
  created_at: string;
};

export type RideRequest = {
  vehicleId: string;
  pickup: { address: string; sector: string; lon: number; lat: number };
  dest: { address: string; sector: string; lon: number; lat: number };
  fuelLevel: number; // 0.25 = 1/4 de réservoir
  reason?: string;
};

export type StartResult = 'ok' | 'wrong_pin' | 'locked';

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export function requestRide(r: RideRequest) {
  return rpc<RideRow>('request_ride', {
    p_vehicle_id: r.vehicleId,
    p_pickup_address: r.pickup.address,
    p_pickup_sector: r.pickup.sector,
    p_pickup_lon: r.pickup.lon,
    p_pickup_lat: r.pickup.lat,
    p_dest_address: r.dest.address,
    p_dest_sector: r.dest.sector,
    p_dest_lon: r.dest.lon,
    p_dest_lat: r.dest.lat,
    p_fuel_level: r.fuelLevel,
    p_reason: r.reason ?? null,
  });
}

export const setDriverOnline = (online: boolean, lon?: number, lat?: number) =>
  rpc('set_driver_online', { p_online: online, p_lon: lon ?? null, p_lat: lat ?? null });

export const acceptRide = (rideId: string) => rpc<RideRow>('accept_ride', { p_ride: rideId });
export const markArrived = (rideId: string) => rpc<RideRow>('mark_arrived', { p_ride: rideId });
export const startRide = (rideId: string, pin: string, fuelVerified: boolean) =>
  rpc<StartResult>('start_ride', { p_ride: rideId, p_pin: pin, p_fuel_verified: fuelVerified });
export const markDropoff = (rideId: string) => rpc<RideRow>('mark_dropoff', { p_ride: rideId });
export const finishRide = (rideId: string) => rpc<RideRow>('finish_ride', { p_ride: rideId });
export const cancelRide = (rideId: string, reason?: string) =>
  rpc<RideRow>('cancel_ride', { p_ride: rideId, p_reason: reason ?? null });
export const rateRide = (rideId: string, stars: number, comment?: string) =>
  rpc<void>('rate_ride', { p_ride: rideId, p_stars: stars, p_comment: comment ?? null });

/** Le code de sécurité n'est lisible que par le client de la course. */
export async function getRidePin(rideId: string): Promise<string | null> {
  const { data, error } = await getSupabase().from('ride_secrets').select('pin').eq('ride_id', rideId).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.pin ?? null;
}
