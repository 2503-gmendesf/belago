import { createContext, useContext } from 'react';
import { DEFAULT_RATES, type PlatformRates } from '@belago/shared';

/** Taxas vigentes. Até carregar (ou se falhar), vale o padrão de `CFG`. */
export const RatesContext = createContext<PlatformRates>(DEFAULT_RATES);

export function useRates(): PlatformRates {
  return useContext(RatesContext);
}
