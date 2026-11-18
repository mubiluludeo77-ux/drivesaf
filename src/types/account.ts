import type { LicenceCode, Province } from '@/types/ride';

export type AccountRole = 'client' | 'driver';
export type DriverStatus = 'pending' | 'approved';

export type DriverInfo = {
  licence: LicenceCode;
  licenceProvince: Province;
  licenceExpires: string; // AAAA-MM-JJ
  status: DriverStatus;
};

export type Account = {
  fullName: string;
  phone: string; // format +1XXXXXXXXXX
  email: string;
  role: AccountRole;
  driver?: DriverInfo;
  createdAt: string;
};
