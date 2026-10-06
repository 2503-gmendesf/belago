export type NotificationType =
  | 'agendamento'
  | 'confirmacao'
  | 'cancelamento'
  | 'horario'
  | 'avaliacao'
  | 'sistema';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO timestamp */
  at: string;
  read: boolean;
}

export const NOTIFICATION_ICON: Record<NotificationType, string> = {
  agendamento: 'calendar',
  confirmacao: 'check-c',
  cancelamento: 'x',
  horario: 'clock',
  avaliacao: 'star',
  sistema: 'info',
};
