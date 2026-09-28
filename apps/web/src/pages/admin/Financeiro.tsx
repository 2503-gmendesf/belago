import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon.js';
import { Button } from '../../components/Button.js';
import { useToast } from '../../components/ToastProvider.js';
import { dataSource } from '../../services/index.js';
import { DisputeOverlay } from '../../features/admin/components/DisputeOverlay.js';
import { brl } from '../../lib/format.js';
import type { AdminDispute, AdminFinancePeriod, AdminFinanceSnapshot, AdminPayout, DisputeResolution } from '../../features/admin/types.js';

const PERIODS: Array<[AdminFinancePeriod, string]> = [
  ['semana', 'Esta semana'],
  ['mes', 'Este mês'],
  ['trim', 'Trimestre'],
  ['ano', 'Ano'],
];

export function Financeiro() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<AdminFinancePeriod>('mes');
  const [snapshot, setSnapshot] = useState<AdminFinanceSnapshot | null>(null);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [disputeId, setDisputeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    dataSource.getAdminFinance(period).then(setSnapshot);
    dataSource.listAdminPayouts().then(setPayouts);
    dataSource.listAdminDisputes().then(setDisputes);
  }, [period]);

  useEffect(() => {
    reload();
  }, [reload]);

  const pendingValue = useMemo(() => payouts.filter((p) => !p.done).reduce((s, p) => s + p.value, 0), [payouts]);
  const dispute = disputes.find((d) => d.id === disputeId) ?? null;

  async function handleProcessPayout(id: string) {
    const payout = payouts.find((p) => p.id === id);
    await dataSource.processAdminPayout(id);
    toast(`PIX enviado para ${payout?.name ?? ''}`);
    reload();
  }

  async function handleProcessAll() {
    if (payouts.every((p) => p.done)) {
      toast('Nenhum repasse pendente');
      return;
    }
    await dataSource.processAllAdminPayouts();
    toast('Todos os repasses processados');
    reload();
  }

  async function handleResolve(id: number, resolution: DisputeResolution) {
    setSubmitting(true);
    try {
      await dataSource.resolveAdminDispute(id, resolution);
      setDisputeId(null);
      toast(resolution === 'reembolso' ? 'Reembolso registrado' : 'Pagamento mantido');
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  if (!snapshot) return <p className="small muted">Carregando…</p>;

  const max = Math.max(1, ...snapshot.weekly.flat());

  return (
    <div>
      <h1 className="h1">Financeiro</h1>
      <div className="chips" style={{ marginTop: 14 }}>
        {PERIODS.map(([k, label]) => (
          <button key={k} className={`chip${period === k ? ' chip-active' : ''}`} onClick={() => setPeriod(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="kpi kpi-dark" style={{ marginTop: 14 }}>
        <p className="eyebrow">GMV total</p>
        <p className="v num" style={{ fontSize: 30 }}>
          {brl(snapshot.gmv)}
        </p>
      </div>
      <div className="kpis" style={{ marginTop: 10 }}>
        <div className="kpi">
          <p className="small muted">Receita da plataforma</p>
          <p className="v num">{brl(snapshot.platform)}</p>
        </div>
        <div className="kpi">
          <p className="small muted">Repasses realizados</p>
          <p className="v num">{brl(snapshot.paid)}</p>
        </div>
        <div className="kpi">
          <p className="small muted">Repasses pendentes</p>
          <p className="v num">{brl(period === 'mes' ? pendingValue : snapshot.pending)}</p>
        </div>
        <div className="kpi">
          <p className="small muted">Taxa média por transação</p>
          <p className="v num">{brl(snapshot.avgFee)}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <p className="h3">Receita por período</p>
        <div className="bars">
          {snapshot.weekly.map(([platform, professionalShare], i) => (
            <div className="col" key={i}>
              <div className="pair">
                <div className="b" style={{ height: `${(platform / max) * 100}%` }} title={brl(platform)} />
                <div className="b exp" style={{ height: `${(professionalShare / max) * 100}%` }} title={brl(professionalShare)} />
              </div>
              <span className="lbl">{snapshot.weekly.length === 1 ? 'Semana' : `P${i + 1}`}</span>
            </div>
          ))}
        </div>
        <div className="legend">
          <span>
            <i /> Plataforma
          </span>
          <span>
            <i className="exp" /> Profissionais
          </span>
        </div>
      </div>

      <div className="section">
        <div className="section-hd">
          <h2 className="h2">Repasses pendentes</h2>
          <Button variant="sec" size="sm" style={{ width: 'auto' }} onClick={handleProcessAll}>
            Processar todos
          </Button>
        </div>
        <div className="list">
          {payouts.map((p) => (
            <div className="li" key={p.id} style={{ opacity: p.done ? 0.45 : 1 }}>
              <div className="pro-body">
                <p className="h3">{p.name}</p>
                <p className="small muted">
                  {p.count} agend. · {p.spec}
                </p>
              </div>
              <p className="h3 num">{brl(p.value)}</p>
              <Button size="sm" style={{ width: 'auto' }} disabled={p.done} onClick={() => handleProcessPayout(p.id)}>
                PIX
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-hd">
          <h2 className="h2">Disputas abertas</h2>
          <span className="tag">{disputes.length}</span>
        </div>
        {disputes.length ? (
          <div className="list">
            {disputes.map((d) => (
              <div className="li" key={d.id}>
                <div className="pro-body">
                  <p className="h3">
                    {d.clientName} vs. {d.professionalName}
                  </p>
                  <p className="small muted">
                    {brl(d.value)} · {d.reason} · {d.date}
                  </p>
                </div>
                <Button variant="sec" size="sm" style={{ width: 'auto' }} onClick={() => setDisputeId(d.id)}>
                  Analisar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Icon name="check-c" />
            <p>Nenhuma disputa aberta.</p>
          </div>
        )}
      </div>

      <DisputeOverlay dispute={dispute} onClose={() => setDisputeId(null)} onResolve={handleResolve} submitting={submitting} />
    </div>
  );
}
