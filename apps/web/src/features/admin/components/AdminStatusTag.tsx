import type { AdminClientStatus, AdminProfStatus } from '../types.js';

type Status = AdminProfStatus | AdminClientStatus;

const LABELS: Record<Status, string> = {
  ativa: 'Ativa',
  pendente: 'Pendente',
  suspensa: 'Suspensa',
  excluida: 'Excluída',
  bloqueada: 'Bloqueada',
};

const CLASSES: Record<Status, string> = {
  ativa: 'tag tag-ok',
  pendente: 'tag tag-warn',
  suspensa: 'tag tag-bad',
  excluida: 'tag tag-bad',
  bloqueada: 'tag tag-bad',
};

export function AdminStatusTag({ status }: { status: Status }) {
  return <span className={CLASSES[status]}>{LABELS[status]}</span>;
}
