export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  apiUrl: (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, ''),
  supportWhatsapp: import.meta.env.VITE_SUPPORT_WHATSAPP ?? '',
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);
