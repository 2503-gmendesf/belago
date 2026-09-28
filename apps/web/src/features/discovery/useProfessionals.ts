import { useEffect, useState } from 'react';
import { dataSource } from '../../services/index.js';
import type { Professional } from './types.js';

interface UseProfessionalsResult {
  professionals: Professional[];
  loading: boolean;
}

export function useProfessionals(): UseProfessionalsResult {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dataSource.listProfessionals().then((list) => {
      if (active) {
        setProfessionals(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { professionals, loading };
}
