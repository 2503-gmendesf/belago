import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../../components/Icon.js';
import { Button } from '../../components/Button.js';
import { Overlay } from '../../components/Overlay.js';
import { useToast } from '../../components/ToastProvider.js';
import { useAuth } from '../../context/AuthContext.js';
import { dataSource } from '../../services/index.js';
import { ServiceFormOverlay } from '../../features/proServices/components/ServiceFormOverlay.js';
import { categoryName } from '../../features/discovery/utils.js';
import { brl, plural } from '../../lib/format.js';
import type { Professional, ProService, ProServiceInput } from '../../features/discovery/types.js';

export function Servicos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pro, setPro] = useState<Professional | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProService | null>(null);
  const [deleting, setDeleting] = useState<ProService | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    if (!user) return;
    dataSource.getMyProfessional(user.id).then(setPro);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!pro) return <p className="small muted">Carregando…</p>;

  const activeCount = pro.services.filter((s) => s.active).length;

  async function handleSave(input: ProServiceInput, id?: string) {
    if (!pro) return;
    setSubmitting(true);
    try {
      await dataSource.saveService(pro.id, input, id);
      setFormOpen(false);
      setEditing(null);
      toast('Serviço salvo');
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(svc: ProService) {
    if (!pro) return;
    await dataSource.toggleServiceActive(pro.id, svc.id);
    toast(svc.active ? 'Serviço desativado' : 'Serviço ativado');
    reload();
  }

  async function handleDelete() {
    if (!pro || !deleting) return;
    setSubmitting(true);
    try {
      await dataSource.deleteService(pro.id, deleting.id);
      setDeleting(null);
      toast('Serviço excluído');
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="h1">Serviços</h1>
      <div className="rowf between" style={{ margin: '14px 0 12px' }}>
        <p className="small muted">{plural(activeCount, 'serviço ativo', 'serviços ativos')}</p>
        <Button
          size="sm"
          style={{ width: 'auto' }}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Icon name="plus" />
          Novo serviço
        </Button>
      </div>

      {pro.services.length ? (
        <div className="list">
          {pro.services.map((s) => (
            <div className="li" key={s.id} style={{ opacity: s.active ? 1 : 0.6 }}>
              <div className="pro-body">
                <p className="h3 ell">{s.name}</p>
                <p className="small muted">
                  {categoryName(s.category)} · {s.durationMin} min · {brl(s.price)}
                </p>
              </div>
              <button
                type="button"
                className={`switch${s.active ? ' switch-on' : ''}`}
                aria-label={s.active ? 'Desativar' : 'Ativar'}
                onClick={() => handleToggle(s)}
              />
              <button
                className="icon-btn"
                aria-label="Editar"
                onClick={() => {
                  setEditing(s);
                  setFormOpen(true);
                }}
              >
                <Icon name="pencil" />
              </button>
              <button className="icon-btn" aria-label="Excluir" onClick={() => setDeleting(s)}>
                <Icon name="trash" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Icon name="layers" />
          <p>Você ainda não cadastrou serviços.</p>
        </div>
      )}
      <p className="tiny faint" style={{ marginTop: 12 }}>
        Alterações não modificam agendamentos existentes: eles mantêm preço, duração e nome contratados.
      </p>

      <ServiceFormOverlay
        open={formOpen}
        service={editing}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        submitting={submitting}
      />

      <Overlay open={deleting !== null} onClose={() => setDeleting(null)}>
        {deleting && (
          <div>
            <div className="center">
              <div className="confirm-ic">
                <Icon name="trash" />
              </div>
              <h2 className="h2">Excluir serviço?</h2>
              <p className="muted small" style={{ margin: '8px 0 20px' }}>
                “{deleting.name}” deixará de ser oferecido. Agendamentos já feitos são preservados.
              </p>
            </div>
            <div className="stack gap8">
              <Button variant="danger" disabled={submitting} onClick={handleDelete}>
                Excluir serviço
              </Button>
              <Button variant="sec" onClick={() => setDeleting(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Overlay>
    </div>
  );
}
