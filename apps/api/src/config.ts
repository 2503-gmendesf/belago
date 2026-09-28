import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().default(3333),
  SUPABASE_URL: z.string().url(),
  // Só existe na API: nunca no front (CLAUDE.md).
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Origens permitidas no CORS, separadas por vírgula.
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  PAYMENT_WEBHOOK_SECRET: z.string().min(16),
});

export interface Config {
  port: number;
  supabaseUrl: string;
  serviceRoleKey: string;
  webOrigins: string[];
  paymentWebhookSecret: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${fields}`);
  }
  const e = parsed.data;
  return {
    port: e.PORT,
    supabaseUrl: e.SUPABASE_URL,
    serviceRoleKey: e.SUPABASE_SERVICE_ROLE_KEY,
    webOrigins: e.WEB_ORIGIN.split(',').map((o) => o.trim()),
    paymentWebhookSecret: e.PAYMENT_WEBHOOK_SECRET,
  };
}
