import type { AppNotification } from '../features/notifications/types.js';

const STORAGE_KEY = 'belago:mock-notifications';

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60000).toISOString();
}

function seed(): AppNotification[] {
  return [
    {
      id: 'n1',
      type: 'confirmacao',
      title: 'Agendamento confirmado',
      body: 'Fernanda Costa confirmou seu atendimento de amanhã às 14:00.',
      at: minutesAgo(35),
      read: false,
    },
    {
      id: 'n2',
      type: 'avaliacao',
      title: 'Avalie seu atendimento',
      body: 'Como foi seu atendimento com Camila Santos? Deixe sua avaliação.',
      at: minutesAgo(180),
      read: false,
    },
    {
      id: 'n3',
      type: 'sistema',
      title: 'Comunicado',
      body: 'Novos serviços de cabelo e penteado disponíveis na sua região.',
      at: minutesAgo(1500),
      read: true,
    },
  ];
}

function seedPro(): AppNotification[] {
  return [
    {
      id: 'n1',
      type: 'agendamento',
      title: 'Novo agendamento',
      body: 'Amanda Ribeiro agendou Design de Sobrancelha.',
      at: minutesAgo(90),
      read: false,
    },
    {
      id: 'n2',
      type: 'sistema',
      title: 'Comunicado',
      body: 'Seu perfil está verificado e visível para clientes.',
      at: minutesAgo(2000),
      read: true,
    },
  ];
}

function readAll(): Record<string, AppNotification[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AppNotification[]>) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, AppNotification[]>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function listForUser(userId: string): AppNotification[] {
  const all = readAll();
  if (!all[userId]) {
    all[userId] = userId === 'demo-profissional' ? seedPro() : seed();
    writeAll(all);
  }
  return all[userId];
}

export function markAllRead(userId: string): AppNotification[] {
  const all = readAll();
  all[userId] = listForUser(userId).map((n) => ({ ...n, read: true }));
  writeAll(all);
  return all[userId];
}
