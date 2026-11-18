export type Province = 'ON' | 'QC';

export type RideStatus =
  | 'idle'
  | 'searching'
  | 'enroute'
  | 'arrived'
  | 'trip'
  | 'dropoff'
  | 'done';

export type LicenceCode = '' | 'G1' | 'G2' | 'G' | 'QCA' | 'QCP' | 'QC5';

export type Gearbox = 'auto' | 'manuelle';

export type Sector = {
  id: string;
  name: string;
  province: Province;
  lat: number;
  lon: number;
};

export type FuelLevel = {
  value: string;
  label: string;
  fraction: number;
};

export type Driver = {
  name: string;
  rating: number;
  trips: number;
  licence: LicenceCode;
};

export type RideForm = {
  pickup: string;
  pickupSector: string;
  dest: string;
  destSector: string;
  car: string;
  plate: string;
  gearbox: Gearbox;
  reason: string;
  fuel: string;
};

export type Estimate = {
  km: number;
  minutes: number;
  night: boolean;
  crossing: boolean;
  price: number;
  taxLabel: string;
  taxAmount: number;
  total: number;
};

export type Order = RideForm &
  Estimate & {
    pin: string;
    eta: number;
    driver: Driver | null;
  };

export type FuelCheck = {
  ok: boolean;
  message: string;
};
