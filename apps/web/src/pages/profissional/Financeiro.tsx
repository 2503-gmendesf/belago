import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon.js';
import { useAuth } from '../../context/AuthContext.js';
import { useRates } from '../../context/ratesContext.js';
import { useToast } from '../../components/ToastProvider.js';
import { dataSource } from '../../services/index.js';
import { ExpenseFormOverlay } from '../../features/proFinance/components/ExpenseFormOverlay.js';
import { calcFinance, buildBins, resolveRange } from '../../features/proFinance/utils.js';
import { fmtDay, todayISO, brl } from '../../lib/format.js';
import { totalOf } from '../../features/appointments/utils.js';
import type { FinRangeKey } from '../../features/proFinance/utils.js';
import type { ProAppointmentView } from '../../features/appointments/types.js';
import type { Expense, CreateExpenseInput } from '../../features/proFinance/types.js';

const RANGE_CHIPS: Array<[FinRangeKey, string]> = [
  ['90', 'Últimos 90 dias'],
  ['30', 'Últimos 30 dias'],
  ['25', 'Últimos 25 dias'],
  ['custom', 'Personalizado'],
];

type MoveFilter = 'all' | 'r' | 'd';

interface Movement {
  key: string;
  type: 'r' | 'd';
  date: string;
  time: string;
  title: string;
  sub: string;
  val: number;
}

export function Financeiro() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<ProAppointmentView[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<FinRangeKey>('30');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(todayISO());
  const [view, setView] = useState<MoveFilter>('all');
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    if (!user) return;
    dataSource.getMyProfessional(user.id).then((pro) => {
      Promise.all([dataSource.listProAppointments(pro.id), dataSource.listExpenses(pro.id)]).then(
        ([appts, exp]) => {
          setAppointments(appts);
          setExpenses(exp);
          setLoading(false);
        },
      );
    });
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  function selectRange(r: FinRangeKey) {
    setRange(r);
  }

  const period = useMemo(() => resolveRange(range, from, to), [range, from, to]);
  const { commissionRate } = useRates();
  const calc = useMemo(
    () => (period ? calcFinance(appointments, expenses, period, commissionRate) : null),
    [appointments, expenses, period, commissionRate],
  );
  const chart = useMemo(() => (calc && period ? buildBins(calc, period) : null), [calc, period]);

  const movements: Movement[] = useMemo(() => {
    if (!calc) return [];
    const revMoves: Movement[] = calc.revenue.map((a) => ({
      key: `r-${a.id}`,
      type: 'r',
      date: a.scheduledDate,
      time: a.scheduledTime,
      title: a.serviceName,
      sub: a.clientName,
      val: totalOf(a),
    }));
    const expMoves: Movement[] = calc.expenses.map((e) => ({
      key: `d-${e.id}`,
      type: 'd',
      date: e.date,
      time: '00:00',
      title: e.desc,
      sub: e.cat,
      val: e.val,
    }));
    return [...revMoves, ...expMoves]
      .filter((m) => view === 'all' || view === m.type)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [calc, view]);

  async function handleSaveExpense(input: CreateExpenseInput) {
    if (!user) return;
    setSubmitting(true);
    try {
      const pro = await dataSource.getMyProfessional(user.id);
      await dataSource.createExpense(pro.id, input);
      setExpenseFormOpen(false);
      toast('Despesa registrada');
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="small muted">Carregando…</p>;

  return (
    <div>
      <h1 className="h1">Financeiro</h1>
      <div className="chips chips-wrap" style={{ marginTop: 14 }}>
        {RANGE_CHIPS.map(([k, label]) => (
          <button key={k} className={`chip${range === k ? ' chip-active' : ''}`} onClick={() => selectRange(k)}>
            {label}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="rowf gap12" style={{ marginTop: 12 }}>
          <div className="field" style={{ flex: 1, margin: 0 }}>
            <label>De</label>
            <input className="input" type="date" value={from} max={todayISO()} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, margin: 0 }}>
            <label>Até</label>
            <input className="input" type="date" value={to} max={todayISO()} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      )}

      {!calc || !chart ? (
        <div className="empty" style={{ marginTop: 16 }}>
          <Icon name="calendar" />
          <p>Informe as duas datas do período.</p>
        </div>
      ) : (
        <>
          <div className="kpi kpi-dark" style={{ marginTop: 14 }}>
            <p className="eyebrow">Receita líquida</p>
            <p className="v num" style={{ fontSize: 30 }}>
              {brl(calc.net)}
            </p>
          </div>
          <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 10 }}>
            <div className="kpi" style={{ padding: 12 }}>
              <p className="tiny muted">Receita bruta</p>
              <p className="h3 num" style={{ marginTop: 6 }}>
                {brl(calc.gross)}
              </p>
            </div>
            <div className="kpi" style={{ padding: 12 }}>
              <p className="tiny muted">Comissão</p>
              <p className="h3 num" style={{ marginTop: 6 }}>
                {brl(calc.commission)}
              </p>
            </div>
            <div className="kpi" style={{ padding: 12 }}>
              <p className="tiny muted">Despesas</p>
              <p className="h3 num" style={{ marginTop: 6 }}>
                {brl(calc.expensesTotal)}
              </p>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="rowf between">
              <p className="h3">Receita e despesas</p>
              <span className="tiny faint">{chart.stepDays === 1 ? 'por dia' : 'por semana'}</span>
            </div>
            <div className="bars">
              {chart.bins.map((b, i) => {
                const max = Math.max(1, ...chart.bins.map((x) => Math.max(x.rev, x.exp)));
                const every = Math.ceil(chart.bins.length / 6);
                return (
                  <div className="col" key={i}>
                    <div className="pair">
                      <div className="b" style={{ height: `${(b.rev / max) * 100}%` }} title={brl(b.rev)} />
                      <div className="b exp" style={{ height: `${(b.exp / max) * 100}%` }} title={brl(b.exp)} />
                    </div>
                    <span className="lbl">{i % every === 0 ? b.label : ' '}</span>
                  </div>
                );
              })}
            </div>
            <div className="legend">
              <span>
                <i /> Receita
              </span>
              <span>
                <i className="exp" /> Despesas
              </span>
            </div>
          </div>

          <div className="section" style={{ marginTop: 22 }}>
            <div className="section-hd">
              <h2 className="h2">Movimentações</h2>
              <button className="btn btn-sm" style={{ width: 'auto' }} onClick={() => setExpenseFormOpen(true)}>
                <Icon name="plus" />
                Registrar despesa
              </button>
            </div>
            <div className="chips" style={{ margin: '12px 0' }}>
              {(
                [
                  ['all', 'Todas'],
                  ['r', 'Receitas'],
                  ['d', 'Despesas'],
                ] as Array<[MoveFilter, string]>
              ).map(([k, label]) => (
                <button key={k} className={`chip${view === k ? ' chip-active' : ''}`} onClick={() => setView(k)}>
                  {label}
                </button>
              ))}
            </div>
            {movements.length ? (
              <div className="list">
                {movements.map((m) => (
                  <div className="movement-row" key={m.key}>
                    <div className="movement-ico">
                      <Icon name={m.type === 'r' ? 'plus' : 'wallet'} />
                    </div>
                    <div className="pro-body">
                      <p className="h3 ell">{m.title}</p>
                      <p className="small muted ell">
                        {m.sub} · {fmtDay(m.date)}
                      </p>
                    </div>
                    <p className="h3 num" style={m.type === 'd' ? { color: 'var(--text2)' } : undefined}>
                      {m.type === 'r' ? '+' : '−'}
                      {brl(m.val)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <Icon name="wallet" />
                <p>Sem movimentações neste período.</p>
              </div>
            )}
          </div>
        </>
      )}

      <ExpenseFormOverlay
        open={expenseFormOpen}
        onClose={() => setExpenseFormOpen(false)}
        onSave={handleSaveExpense}
        submitting={submitting}
      />
    </div>
  );
}
