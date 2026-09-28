import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { AppointmentLocation } from '../appointments/types.js';

export interface BookingState {
  professionalId: string;
  serviceId: string | null;
  date: string | null;
  time: string | null;
  location: AppointmentLocation;
  address: string;
  step: 1 | 2;
}

interface BookingContextValue {
  booking: BookingState | null;
  start: (professionalId: string, serviceId?: string | null, date?: string | null) => void;
  update: <K extends keyof BookingState>(key: K, value: BookingState[K]) => void;
  setStep: (step: 1 | 2) => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState | null>(null);

  const start = useCallback((professionalId: string, serviceId: string | null = null, date: string | null = null) => {
    setBooking({ professionalId, serviceId, date, time: null, location: 'estudio', address: '', step: 1 });
  }, []);

  const update = useCallback(<K extends keyof BookingState>(key: K, value: BookingState[K]) => {
    setBooking((b) => {
      if (!b) return b;
      const next: BookingState = { ...b, [key]: value };
      if (key === 'serviceId') {
        next.date = null;
        next.time = null;
      }
      if (key === 'date') {
        next.time = null;
      }
      return next;
    });
  }, []);

  const setStep = useCallback((step: 1 | 2) => {
    setBooking((b) => (b ? { ...b, step } : b));
  }, []);

  const reset = useCallback(() => setBooking(null), []);

  return (
    <BookingContext.Provider value={{ booking, start, update, setStep, reset }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking deve ser usado dentro de BookingProvider');
  return ctx;
}
