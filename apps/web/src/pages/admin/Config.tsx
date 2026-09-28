import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../../components/Icon.js';
import { Button } from '../../components/Button.js';
import { useToast } from '../../components/ToastProvider.js';
import { dataSource } from '../../services/index.js';
import { ConfirmOverlay } from '../../features/admin/components/ConfirmOverlay.js';
import type { AdminConfig, AdminConfigToggles } from '../../features/admin/types.js';

const VERIFICATION_TOGGLES: Array<[keyof AdminConfigToggles, string, string]> = [
  ['verify', 'Exigir verificação antes de aparecer', 'Só aparece após aprovação'],
  ['identity', 'Identidade obrigatória', 'RG/CPF e selfie'],
  ['certs', 'Verificar certificados', 'Cursos e especializações'],
];

const CONTENT_TOGGLES: Array<[keyof AdminConfigToggles, string]> = [
  ['reviews', 'Revisão manual de avaliações reportadas'],
  ['portfolio', 'Aprovar portfólios antes de publicar'],
];

const CITIES: Array<[string, boolean]> = [
  ['Belo Horizonte', true],
  ['Betim', true],
  ['Contagem', false],
  ['Uberlândia', false],
];

export function Config() {
  const { toast } = useToast();
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [rates, setRates] = useState({ commissionPct: '', depositMin: '', payoutDays: '', homeFee: '', lateFeePct: '' });
  const [pushOpen, setPushOpen] = useState(false);

  const reload = useCallback(() => {
    dataSource.getAdminConfig().then((c) => {
      setConfig(c);
      setRates({
        commissionPct: String(c.commissionPct),
        depositMin: String(c.depositMin),
        payoutDays: String(c.payoutDays),
        homeFee: String(c.homeFee),
        lateFeePct: String(c.lateFeePct),
      });
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!config) return <p className="small muted">Carregando…</p>;

  async function handleSaveRates() {
    const parsed = {
      commissionPct: parseFloat(rates.commissionPct),
      depositMin: parseFloat(rates.depositMin),
      payoutDays: parseFloat(rates.payoutDays),
      homeFee: parseFloat(rates.homeFee),
      lateFeePct: parseFloat(rates.lateFeePct),
    };
    const invalid = Object.values(parsed).some((n) => !(n >= 0)) || parsed.commissionPct > 50 || parsed.lateFeePct > 100;
    if (invalid) {
      toast('Confira os valores informados');
      return;
    }
    await dataSource.saveAdminConfig(parsed);
    toast('Taxas salvas');
    reload();
  }

  async function handleToggle(key: keyof AdminConfigToggles) {
    await dataSource.toggleAdminConfigFlag(key);
    reload();
  }

  async function handleMaintenance() {
    const updated = await dataSource.toggleAdminMaintenance();
    toast(updated.maintenance ? 'Modo manutenção ativado' : 'Modo manutenção desativado');
    reload();
  }

  return (
    <div>
      <h1 className="h1">Configurações</h1>

      <div className="section" style={{ marginTop: 16 }}>
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Taxas e comissões
        </h2>
        <div className="card">
          <div className="field">
            <label>Comissão da plataforma (%)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={rates.commissionPct}
              onChange={(e) => setRates((r) => ({ ...r, commissionPct: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Sinal mínimo por agendamento (R$)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={rates.depositMin}
              onChange={(e) => setRates((r) => ({ ...r, depositMin: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Prazo de repasse (dias úteis)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={rates.payoutDays}
              onChange={(e) => setRates((r) => ({ ...r, payoutDays: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Taxa de deslocamento (R$)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={rates.homeFee}
              onChange={(e) => setRates((r) => ({ ...r, homeFee: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Multa de cancelamento tardio (%)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={rates.lateFeePct}
              onChange={(e) => setRates((r) => ({ ...r, lateFeePct: e.target.value }))}
            />
          </div>
          <Button style={{ marginTop: 8 }} onClick={handleSaveRates}>
            Salvar taxas
          </Button>
        </div>
      </div>

      <div className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Verificação de profissionais
        </h2>
        <div className="list">
          {VERIFICATION_TOGGLES.map(([key, title, sub]) => (
            <div className="li" key={key}>
              <div className="pro-body">
                <p className="h3">{title}</p>
                <p className="small muted">{sub}</p>
              </div>
              <button
                type="button"
                className={`switch${config.toggles[key] ? ' switch-on' : ''}`}
                aria-label={title}
                onClick={() => handleToggle(key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Controle de conteúdo
        </h2>
        <div className="list">
          {CONTENT_TOGGLES.map(([key, title]) => (
            <div className="li" key={key}>
              <p className="pro-body h3">{title}</p>
              <button
                type="button"
                className={`switch${config.toggles[key] ? ' switch-on' : ''}`}
                aria-label={title}
                onClick={() => handleToggle(key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-hd">
          <h2 className="h2">Cidades ativas</h2>
        </div>
        <div className="list">
          {CITIES.map(([name, on]) => (
            <div className="li" key={name}>
              <span className="pro-body h3">{name}</span>
              <span className={`tag${on ? ' tag-ok' : ''}`}>{on ? 'Ativa' : 'Em breve'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Sistema
        </h2>
        <div className="list">
          <div className="li">
            <span className="pro-body h3">Versão do app</span>
            <span className="small muted">1.1.0</span>
          </div>
          <div className="li">
            <div className="pro-body">
              <p className="h3">Modo manutenção</p>
              <p className="small muted">Bloqueia novos agendamentos</p>
            </div>
            <button
              type="button"
              className={`switch${config.maintenance ? ' switch-on' : ''}`}
              aria-label="Modo manutenção"
              onClick={handleMaintenance}
            />
          </div>
        </div>
        {config.maintenance && (
          <p className="small warn-banner">Modo manutenção ativo: novos agendamentos estão bloqueados.</p>
        )}
      </div>

      <div className="stack gap8" style={{ marginTop: 22 }}>
        <Button variant="sec" onClick={() => toast('Relatório gerado')}>
          <Icon name="download" />
          Exportar relatório
        </Button>
        <Button variant="sec" onClick={() => setPushOpen(true)}>
          <Icon name="bell" />
          Push para todos os usuários
        </Button>
      </div>

      <ConfirmOverlay
        open={pushOpen}
        icon="bell"
        title="Enviar push para todos?"
        description="A notificação será enviada a todos os usuários."
        confirmLabel="Enviar"
        onClose={() => setPushOpen(false)}
        onConfirm={() => {
          setPushOpen(false);
          toast('Push enviado');
        }}
      />
    </div>
  );
}
