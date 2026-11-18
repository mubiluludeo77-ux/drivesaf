'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';

import {
  AUTO_ACCEPT_MS,
  DEMO_DRIVERS,
  DRIVER_SHARE,
  ENROUTE_MS,
  REASONS,
  TRIP_MS,
  licenceOk,
} from '@/data/config';
import { estimate } from '@/utils/pricing';
import type { Driver, LicenceCode, Order, RideForm, RideStatus } from '@/types/ride';

// ------------------------------------------------------------
// État (partagé entre l'écran client et l'écran chauffeur)
// Plus tard, la course viendra de la base de données (table rides).
// ------------------------------------------------------------
type RideState = {
  status: RideStatus;
  form: RideForm;
  order: Order | null;
  progress: number; // 0 → 1 pendant « enroute » et « trip »
  realDriver: boolean; // true si c'est l'écran chauffeur qui a accepté
  driverOnline: boolean;
  driverLicence: LicenceCode;
  pinInput: string;
  pinError: string;
  fuelOk: boolean;
  earnings: number;
  trips: number;
  rating: number;
};

const initialState: RideState = {
  status: 'idle',
  form: {
    pickup: '',
    pickupSector: '',
    dest: '',
    destSector: '',
    car: '',
    plate: '',
    gearbox: 'auto',
    reason: REASONS[0],
    fuel: '',
  },
  order: null,
  progress: 0,
  realDriver: false,
  driverOnline: false,
  driverLicence: '',
  pinInput: '',
  pinError: '',
  fuelOk: false,
  earnings: 0,
  trips: 0,
  rating: 0,
};

type Action =
  | { type: 'setField'; field: keyof RideForm; value: string }
  | { type: 'order'; order: Order }
  | { type: 'assign'; driver: Driver; real: boolean }
  | { type: 'progress'; value: number }
  | { type: 'arrive' }
  | { type: 'startTrip' }
  | { type: 'dropoff' }
  | { type: 'finish' }
  | { type: 'cancel' }
  | { type: 'rate'; value: number }
  | { type: 'toggleOnline' }
  | { type: 'setLicence'; value: LicenceCode }
  | { type: 'setPin'; value: string }
  | { type: 'setPinError'; value: string }
  | { type: 'setFuelOk'; value: boolean };

function reducer(s: RideState, a: Action): RideState {
  switch (a.type) {
    case 'setField':
      return { ...s, form: { ...s.form, [a.field]: a.value } };
    case 'order':
      return { ...s, status: 'searching', order: a.order, realDriver: false, rating: 0 };
    case 'assign':
      if (s.status !== 'searching' || !s.order) return s;
      return {
        ...s,
        status: 'enroute',
        progress: 0,
        realDriver: a.real,
        order: { ...s.order, driver: a.driver },
      };
    case 'progress':
      return { ...s, progress: a.value };
    case 'arrive':
      if (s.status !== 'enroute') return s;
      return { ...s, status: 'arrived', progress: 1, pinInput: '', pinError: '', fuelOk: false };
    case 'startTrip':
      if (s.status !== 'arrived') return s;
      return { ...s, status: 'trip', progress: 0, pinError: '' };
    case 'dropoff':
      if (s.status !== 'trip') return s;
      return { ...s, status: 'dropoff', progress: 1 };
    case 'finish':
      if (s.status !== 'dropoff' || !s.order) return s;
      return {
        ...s,
        status: 'done',
        earnings: s.realDriver ? s.earnings + s.order.price * DRIVER_SHARE : s.earnings,
        trips: s.realDriver ? s.trips + 1 : s.trips,
      };
    case 'cancel':
      return { ...s, status: 'idle', order: null, realDriver: false, progress: 0 };
    case 'rate':
      return { ...s, rating: a.value };
    case 'toggleOnline':
      if (!s.driverOnline && !licenceOk(s.driverLicence)) return s; // permis minimum
      return { ...s, driverOnline: !s.driverOnline };
    case 'setLicence':
      return { ...s, driverLicence: a.value };
    case 'setPin':
      return { ...s, pinInput: a.value.replace(/\D/g, '').slice(0, 4) };
    case 'setPinError':
      return { ...s, pinError: a.value };
    case 'setFuelOk':
      return { ...s, fuelOk: a.value };
  }
}

function randomDriver(): Driver {
  return DEMO_DRIVERS[Math.floor(Math.random() * DEMO_DRIVERS.length)];
}

// ------------------------------------------------------------
// Contexte
// ------------------------------------------------------------
type RideActions = {
  setField: (field: keyof RideForm, value: string) => void;
  placeOrder: () => void;
  accept: () => void;
  refuse: () => void;
  checkPin: () => void;
  skip: () => void;
  finish: () => void;
  cancel: () => void;
  lowFuel: () => void;
  rate: (value: number) => void;
  toggleOnline: () => void;
  setLicence: (value: LicenceCode) => void;
  setPin: (value: string) => void;
  setFuelOk: (value: boolean) => void;
};

const RideContext = createContext<{ state: RideState; actions: RideActions } | null>(null);

export function RideProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { status, driverOnline, realDriver } = state;

  // Démo : un chauffeur simulé accepte si personne n'est en ligne côté chauffeur,
  // puis démarre et termine la course tout seul.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (status === 'searching' && !driverOnline) {
      timer = setTimeout(
        () => dispatch({ type: 'assign', driver: randomDriver(), real: false }),
        AUTO_ACCEPT_MS
      );
    } else if (status === 'arrived' && !realDriver) {
      timer = setTimeout(() => dispatch({ type: 'startTrip' }), 2500);
    } else if (status === 'dropoff' && !realDriver) {
      timer = setTimeout(() => dispatch({ type: 'finish' }), 2000);
    }

    return () => clearTimeout(timer);
  }, [status, driverOnline, realDriver]);

  // Animation du déplacement (chauffeur → client, puis client → destination)
  useEffect(() => {
    if (status !== 'enroute' && status !== 'trip') return;

    const duration = status === 'enroute' ? ENROUTE_MS : TRIP_MS;
    const next = status === 'enroute' ? 'arrive' : 'dropoff';
    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const value = Math.min(1, (now - start) / duration);
      dispatch({ type: 'progress', value });
      if (value < 1) frame = requestAnimationFrame(step);
      else dispatch({ type: next });
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [status]);

  const actions: RideActions = {
    setField: (field, value) => dispatch({ type: 'setField', field, value }),

    placeOrder: () => {
      const order: Order = {
        ...state.form,
        ...estimate(state.form),
        pin: String(1000 + Math.floor(Math.random() * 9000)),
        eta: 4 + Math.floor(Math.random() * 6),
        driver: null,
      };
      dispatch({ type: 'order', order });
    },

    accept: () =>
      dispatch({
        type: 'assign',
        real: true,
        driver: {
          name: 'Vous (chauffeur)',
          rating: 4.9,
          trips: state.trips + 12,
          licence: state.driverLicence,
        },
      }),

    refuse: () => dispatch({ type: 'assign', driver: randomDriver(), real: false }),

    checkPin: () => {
      if (!state.fuelOk) {
        dispatch({ type: 'setPinError', value: "Vérifiez d'abord la jauge de carburant (minimum 1/4)." });
      } else if (state.pinInput === state.order?.pin) {
        dispatch({ type: 'startTrip' });
      } else {
        dispatch({ type: 'setPinError', value: 'Code incorrect. Revérifiez avec le client.' });
      }
    },

    skip: () => {
      if (status === 'enroute') dispatch({ type: 'arrive' });
      else if (status === 'trip') dispatch({ type: 'dropoff' });
    },

    finish: () => dispatch({ type: 'finish' }),
    cancel: () => dispatch({ type: 'cancel' }),

    lowFuel: () => {
      dispatch({ type: 'cancel' });
      alert('Course annulée : la jauge est sous 1/4. Des frais de déplacement peuvent être facturés au client (démo).');
    },

    rate: (value) => dispatch({ type: 'rate', value }),
    toggleOnline: () => dispatch({ type: 'toggleOnline' }),
    setLicence: (value) => dispatch({ type: 'setLicence', value }),
    setPin: (value) => dispatch({ type: 'setPin', value }),
    setFuelOk: (value) => dispatch({ type: 'setFuelOk', value }),
  };

  return <RideContext.Provider value={{ state, actions }}>{children}</RideContext.Provider>;
}

export function useRide() {
  const context = useContext(RideContext);

  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }

  return context;
}
