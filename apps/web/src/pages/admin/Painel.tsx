import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon.js';
import { useToast } from '../../components/ToastProvider.js';
import { dataSource } from '../../services/index.js';
import type { AdminDispute, AdminProfessional } from '../../features/admin/types.js';

const ZONES: Array<[string, number]> = [
  ['Centro BH', 124],
  ['Betim', 78],
  ['Contagem', 45],
  ['Norte BH', 31],
  ['Sul BH', 28],
];
const ZONE_MAX = 124;

const ACTIVITY: Array<[string, string, string]> = [
  ['check-c', 'Bruna Oliveira concluiu a verificação', 'há 2 min · Maquiagem · Contagem'],
  ['user', 'Nova profissional cadastrada em Betim', 'há 8 min · Depilação · Kézia Lima'],
  ['calendar', '234 agendamentos realizados hoje', 'há 15 min · meta diária atingida'],
  ['alert', 'Disputa aberta por Rafaela Santos', 'há 32 min · agendamento #4521'],
  ['dollar', 'Repasse de R$ 1.240 processado', 'há 1 h · 12 profissionais · PIX'],
];

export function Painel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);

  useEffect(() => {
    dataSource.listAdminProfessionals().then(setProfessionals);
    dataSource.listAdminDisputes().then(setDisputes);
  }, []);

  const pendingCount = professionals.filter((p) => p.status === 'pendente').length;

  return (
    <div>
      <h1 className="h1">Painel</h1>
      <p className="small muted">Visão geral da plataforma</p>

      <div className="kpis-2" style={{ marginTop: 16 }}>
        <div className="kpi">
          <p className="small muted">Clientes</p>
          <p className="v num">3.421</p>
          <p className="tiny faint" style={{ marginTop: 2 }}>
            +89 esta semana
          </p>
        </div>
        <div className="kpi">
          <p className="small muted">Profissionais ativas</p>
          <p className="v num">847</p>
          <p className="tiny faint" style={{ marginTop: 2 }}>
            +12 esta semana
          </p>
        </div>
        <div className="kpi">
          <p className="small muted">Agendamentos hoje</p>
          <p className="v num">234</p>
          <p className="tiny faint" style={{ marginTop: 2 }}>
            18% acima de ontem
          </p>
        </div>
        <div className="kpi">
          <p className="small muted">GMV do mês</p>
          <p className="v num">R$ 48.320</p>
          <p className="tiny faint" style={{ marginTop: 2 }}>
            23% acima do mês anterior
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
        {ZONES.map(([name, value]) => (
          <div className="zone-row" key={name}>
            <span className="small zone-name">{name}</span>
            <div className="zone-track">
              <div className="zone-fill" style={{ width: `${(value / ZONE_MAX) * 100}%` }} />
            </div>
            <span className="small num muted zone-value">{value}</span>
          </div>
        ))}
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
