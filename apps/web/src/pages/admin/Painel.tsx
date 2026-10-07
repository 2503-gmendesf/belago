import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon.js';
import { useToast } from '../../components/ToastProvider.js';
import { brl } from '../../lib/format.js';
import { dataSource } from '../../services/index.js';
import type { AdminDispute, AdminOverview, AdminProfessional } from '../../features/admin/types.js';

const ACTIVITY: Array<[string, string, string]> = [
  ['check-c', 'Bruna Oliveira concluiu a verificação', 'há 2 min · Maquiagem · Contagem'],
  ['user', 'Nova profissional cadastrada em Betim', 'há 8 min · Depilação · Kézia Lima'],
  ['calendar', '234 agendamentos realizados hoje', 'há 15 min · meta diária atingida'],
  ['alert', 'Disputa aberta por Rafaela Santos', 'há 32 min · agendamento #4521'],
  ['dollar', 'Repasse de R$ 1.240 processado', 'há 1 h · 12 profissionais · PIX'],
];

function compare(current: number, previous: number, label: string): string {
  if (previous <= 0) return `sem dados ${label}`;
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${Math.abs(pct)}% ${pct >= 0 ? 'acima' : 'abaixo'} ${label}`;
}

export function Painel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);

  useEffect(() => {
    const fail = (e: unknown) => toast(e instanceof Error ? e.message : 'Não foi possível carregar o painel');
    dataSource.getAdminOverview().then(setOverview).catch(fail);
    dataSource.listAdminProfessionals().then(setProfessionals).catch(fail);
    // Disputas ainda não migradas para o Supabase: sem elas o contador fica em 0.
    Promise.resolve()
      .then(() => dataSource.listAdminDisputes())
      .then(setDisputes)
      .catch(() => undefined);
  }, [toast]);

  const pendingCount = professionals.filter((p) => p.status === 'pendente').length;
  const zones = overview?.zones ?? [];
  const zoneMax = Math.max(1, ...zones.map(([, value]) => value));

  return (
    <div>
      <h1 className="h1">Painel</h1>
      <p className="small muted">Visão geral da plataforma</p>

      <div className="kpis-2" style={{ marginTop: 16 }}>
        <div className="kpi">
          <p className="small muted">Clientes</p>
          <p className="v num">{overview ? overview.clients.toLocaleString('pt-BR') : '—'}</p>
          <p className="tiny faint" style={{ marginTop: 2 }}>
            {overview ? `+${overview.clientsWeek} esta semana` : ' '}
          </p>
        </div>
        <div className="kpi">
          <p className="small muted">Profissionais ativas</p>
          <p className="v num">{overview ? overview.professionals.toLocaleString('pt-BR') : '—'}</p>
          <p className="tiny faint" style={{ marginTop: 2 }}>
            {overview ? `+${overview.professionalsWeek} esta semana` : ' '}
          </p>
        </div>
        <div className="kpi">
          <p className="small muted">Agendamentos hoje</p>
          <p className="v num">{overview ? overview.appointmentsToday.toLocaleString('pt-BR') : '—'}</p>
          <p className="tiny faint" style={{ marginTop: 2 }}>
            {overview ? compare(overview.appointmentsToday, overview.appointmentsYesterday, 'de ontem') : ' '}
          </p>
        </div>
        <div className="kpi">
          <p className="small muted">GMV do mês</p>
          <p className="v num">{overview ? brl(overview.gmvMonth) : '—'}</p>
          <p className="tiny faint" style={{ marginTop: 2 }}>
            {overview ? compare(overview.gmvMonth, overview.gmvPrevMonth, 'do mês anterior') : ' '}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <p className="h3">Crescimento — últimos 30 dias</p>
        <svg viewBox="0 0 300 90" preserveAspectRatio="none" style={{ width: '100%', height: 90, marginTop: 12 }}>
          <polyline
            points="0,72 30,65 60,58 90,50 120,45 150,38 180,30 210,25 240,20 270,15 300,10"
            fill="none"
            stroke="var(--ink)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points="0,78 30,74 60,70 90,66 120,62 150,55 180,50 210,45 240,40 270,35 300,30"
            fill="none"
            stroke="var(--border2)"
            strokeWidth={2}
            strokeDasharray="4 3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="legend">
          <span>
            <i /> Agendamentos
          </span>
          <span>
            <i className="exp" /> Cadastros
          </span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <p className="h3">Concentração de atendimentos</p>
        <p className="tiny muted" style={{ marginBottom: 12 }}>
          Região de BH e entorno · este mês
        </p>
        {zones.map(([name, value]) => (
          <div className="zone-row" key={name}>
            <span className="small zone-name">{name}</span>
            <div className="zone-track">
              <div className="zone-fill" style={{ width: `${(value / zoneMax) * 100}%` }} />
            </div>
            <span className="small num muted zone-value">{value}</span>
          </div>
        ))}
        {overview && !zones.length && <p className="small muted">Nenhum atendimento neste mês.</p>}
      </div>

      <div className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Ações pendentes
        </h2>
        <div className="list">
          <button className="li" onClick={() => navigate('/admin/profissionais?filtro=pendente')}>
            <Icon name="shield-check" />
            <div className="pro-body">
              <p className="h3">{pendingCount} profissionais aguardando verificação</p>
              <p className="small muted">Documentos enviados</p>
            </div>
            <Icon name="chevron-right" />
          </button>
          <button className="li" onClick={() => navigate('/admin/financeiro')}>
            <Icon name="alert" />
            <div className="pro-body">
              <p className="h3">{disputes.length} disputas de pagamento abertas</p>
              <p className="small muted">Requerem análise</p>
            </div>
            <Icon name="chevron-right" />
          </button>
          <button className="li" onClick={() => toast('Moderação de avaliações em breve')}>
            <Icon name="star" />
            <div className="pro-body">
              <p className="h3">12 avaliações reportadas</p>
              <p className="small muted">Conteúdo inadequado</p>
            </div>
            <Icon name="chevron-right" />
          </button>
          <button className="li" onClick={() => navigate('/admin/financeiro')}>
            <Icon name="dollar" />
            <div className="pro-body">
              <p className="h3">Repasse semanal pronto</p>
              <p className="small muted">Aguardando processamento</p>
            </div>
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>

      <div className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Últimas atividades
        </h2>
        <div className="card" style={{ padding: '4px 16px' }}>
          {ACTIVITY.map(([icon, title, sub], i) => (
            <div className="activity-row" key={i}>
              <div className="activity-ico">
                <Icon name={icon} />
              </div>
              <div className="pro-body">
                <p className="h3">{title}</p>
                <p className="tiny muted">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
