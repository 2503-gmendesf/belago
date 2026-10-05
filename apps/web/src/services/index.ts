import { hasSupabaseConfig } from '../env.js';
import { createMockDataSource } from './mockDataSource.js';
import { createSupabaseDataSource } from './supabaseDataSource.js';
import type { DataSource } from './types.js';

export type { AuthUser, DataSource, ProfileUpdateInput, SignUpInput } from './types.js';

export const dataSource: DataSource = hasSupabaseConfig
  ? createSupabaseDataSource()
  : createMockDataSource();
