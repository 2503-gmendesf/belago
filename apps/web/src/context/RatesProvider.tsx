import { useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_RATES, type PlatformRates } from '@belago/shared';
import { dataSource } from '../services/index.js';
import { RatesContext } from './ratesContext.js';

/** Carrega uma vez as taxas configuradas pelo admin, para a interface mostrar o mesmo valor que a API cobra. */
export function RatesProvider({ children }: { children: ReactNode }) {
  const [rates, setRates] = useState<PlatformRates>(DEFAULT_RATES);

  useEffect(() => {
    let active = true;
    dataSource
      .getPlatformRates()
      .then((r) => {
        if (active) setRates(r);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return <RatesContext.Provider value={rates}>{children}</RatesContext.Provider>;
}
