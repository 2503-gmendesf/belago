import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ToastProvider.js';
import { dataSource } from '../../services/index.js';
import { EditProOverlay } from '../../features/proProfile/components/EditProOverlay.js';
import { PresentationOverlay } from '../../features/proProfile/components/PresentationOverlay.js';
import { DocsOverlay } from '../../features/proProfile/components/DocsOverlay.js';
import { PayoutOverlay } from '../../features/proProfile/components/PayoutOverlay.js';
import { HelpOverlay } from '../../features/profile/components/HelpOverlay.js';
import { LegalOverlay } from '../../features/profile/components/LegalOverlay.js';
import { DeleteAccountOverlay } from '../../features/profile/components/DeleteAccountOverlay.js';
import { LogoutOverlay } from '../../features/profile/components/LogoutOverlay.js';
import { FAQ_PRO } from '../../features/profile/faqData.js';
import type { Professional, ProBankInfo, ProPixInfo } from '../../features/discovery/types.js';
import type { ProProfileBasicInput, ProPresentationInput } from '../../services/types.js';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Perfil() {
  const { user, doLogout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [pro, setPro] = useState<Professional | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    if (!user) return;
    dataSource.getMyProfessional(user.id).then(setPro);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleConfirmLogout() {
    await doLogout();
    toast('Até logo');
    navigate('/login', { replace: true });
  }

  async function handleConfirmDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      await dataSource.requestAccountDeletion(user.id);
      setDeleteOpen(false);
      toast('Sua conta foi excluída.');
      setTimeout(() => {
        void handleConfirmLogout();
      }, 900);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveBasic(input: ProProfileBasicInput) {
    if (!pro) return;
    setSubmitting(true);
    try {
      await dataSource.updateMyProfessional(pro.id, input);
      setEditOpen(false);
      toast('Perfil atualizado');
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSavePresentation(input: ProPresentationInput) {
    if (!pro) return;
    setSubmitting(true);
    try {
      await dataSource.updatePresentation(pro.id, input);
      setPresentationOpen(false);
      toast('Apresentação salva');
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddDoc(doc: { name: string; size: number; type: string }) {
    if (!pro) return;
    await dataSource.addDocument(pro.id, doc);
    reload();
  }

  async function handleRemoveDoc(docId: string) {
    if (!pro) return;
    await dataSource.removeDocument(pro.id, docId);
    reload();
  }

  async function handleSavePayout(pix: ProPixInfo, bank: ProBankInfo) {
    if (!pro) return;
    setSubmitting(true);
    try {
      await dataSource.savePayout(pro.id, pix, bank);
      setPayoutOpen(false);
      toast('Dados de recebimento salvos');
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  if (!pro) return <p className="small muted">Carregando…</p>;

  return (
    <div>
      <h1 className="h1">Perfil</h1>

      <div className="card" style={{ marginTop: 14, textAlign: 'center' }}>
        <div
          className="avatar avatar-lg"
          style={{ margin: '4px auto 12px', backgroundImage: pro.photoUrl ? `url('${pro.photoUrl}')` : undefined }}
        >
          {pro.photoUrl ? '' : initials(pro.name)}
        </div>
        <h2 className="h2">{pro.name}</h2>
        <p className="small muted">{pro.city}</p>
        <div className="rowf gap8" style={{ justifyContent: 'center', marginTop: 10 }}>
          <span className="badge badge-ok">
            <Icon name="shield-check" />
            Verificada
          </span>
          <span className="badge">
            <Icon name="star" />
            {pro.rating.toFixed(1)}
          </span>
        </div>
        <button className="btn btn-sec btn-sm" style={{ margin: '14px auto 0' }} onClick={() => setEditOpen(true)}>
          <Icon name="pencil" />
          Editar perfil
        </button>
      </div>

      <p className="eyebrow" style={{ margin: '22px 0 8px' }}>
        Perfil público
      </p>
      <div className="list">
        <button className="li" onClick={() => setPresentationOpen(true)}>
          <Icon name="image" />
          <span className="pro-body h3">Apresentação profissional</span>
          <Icon name="chevron-right" />
        </button>
        <button className="li" onClick={() => setDocsOpen(true)}>
          <Icon name="file-text" />
          <span className="pro-body h3">Documentações profissionais</span>
          <Icon name="chevron-right" />
        </button>
      </div>

      <p className="eyebrow" style={{ margin: '22px 0 8px' }}>
        Financeiro
      </p>
      <div className="list">
        <button className="li" onClick={() => setPayoutOpen(true)}>
          <Icon name="bank" />
          <span className="pro-body h3">Dados para recebimento</span>
          <Icon name="chevron-right" />
        </button>
      </div>

      <p className="eyebrow" style={{ margin: '22px 0 8px' }}>
        Conta
      </p>
      <div className="list">
        <button className="li" onClick={() => setHelpOpen(true)}>
          <Icon name="help" />
          <span className="pro-body h3">Ajuda e Suporte</span>
          <Icon name="chevron-right" />
        </button>
        <button className="li" onClick={() => setLegalOpen(true)}>
          <Icon name="file-text" />
          <span className="pro-body h3">Privacidade e Termos</span>
          <Icon name="chevron-right" />
        </button>
      </div>

      <button className="btn btn-danger" style={{ marginTop: 20 }} onClick={() => setLogoutOpen(true)}>
        <Icon name="logout" />
        Sair da conta
      </button>

      <EditProOverlay
        open={editOpen}
        professional={pro}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveBasic}
        submitting={submitting}
      />
      <PresentationOverlay
        open={presentationOpen}
        professional={pro}
        onClose={() => setPresentationOpen(false)}
        onSave={handleSavePresentation}
        submitting={submitting}
      />
      <DocsOverlay
        open={docsOpen}
        docs={pro.docs}
        onClose={() => setDocsOpen(false)}
        onAdd={handleAddDoc}
        onRemove={handleRemoveDoc}
      />
      <PayoutOverlay
        open={payoutOpen}
        professional={pro}
        onClose={() => setPayoutOpen(false)}
        onSave={handleSavePayout}
        submitting={submitting}
      />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} faq={FAQ_PRO} />
      <LegalOverlay
        open={legalOpen}
        onClose={() => setLegalOpen(false)}
        onRequestDelete={() => {
          setLegalOpen(false);
          setDeleteOpen(true);
        }}
      />
      <DeleteAccountOverlay
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        submitting={deleting}
      />
      <LogoutOverlay open={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={handleConfirmLogout} />
    </div>
  );
}
