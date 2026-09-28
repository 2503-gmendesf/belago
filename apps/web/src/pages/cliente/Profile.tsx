import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon.js';
import { useToast } from '../../components/ToastProvider.js';
import { useAuth } from '../../context/AuthContext.js';
import { dataSource } from '../../services/index.js';
import { EditProfileOverlay } from '../../features/profile/components/EditProfileOverlay.js';
import { HelpOverlay } from '../../features/profile/components/HelpOverlay.js';
import { LegalOverlay } from '../../features/profile/components/LegalOverlay.js';
import { DeleteAccountOverlay } from '../../features/profile/components/DeleteAccountOverlay.js';
import { LogoutOverlay } from '../../features/profile/components/LogoutOverlay.js';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Profile() {
  const { user, doLogout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

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
      toast('Solicitação enviada. Sua conta será apagada em até 7 dias.');
      setTimeout(() => {
        void handleConfirmLogout();
      }, 900);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <h1 className="h1">Perfil</h1>

      <div className="card" style={{ marginTop: 14, textAlign: 'center' }}>
        <div
          className="avatar avatar-lg"
          style={{
            margin: '4px auto 12px',
            backgroundImage: user.photoUrl ? `url('${user.photoUrl}')` : undefined,
          }}
        >
          {user.photoUrl ? '' : initials(user.name)}
        </div>
        <h2 className="h2">{user.name}</h2>
        <p className="small muted">{user.email}</p>
        {user.phone && <p className="small muted">{user.phone}</p>}
        <button className="btn btn-sec btn-sm" style={{ margin: '14px auto 0' }} onClick={() => setEditOpen(true)}>
          <Icon name="pencil" />
          Editar perfil
        </button>
      </div>

      <div className="list" style={{ marginTop: 16 }}>
        <button className="li" onClick={() => setLegalOpen(true)}>
          <Icon name="file-text" />
          <span className="pro-body h3">Privacidade e Termos</span>
          <Icon name="chevron-right" />
        </button>
        <button className="li" onClick={() => setHelpOpen(true)}>
          <Icon name="help" />
          <span className="pro-body h3">Ajuda e Suporte</span>
          <Icon name="chevron-right" />
        </button>
      </div>

      <button className="btn btn-danger" style={{ marginTop: 20 }} onClick={() => setLogoutOpen(true)}>
        <Icon name="logout" />
        Sair da conta
      </button>

      <EditProfileOverlay open={editOpen} onClose={() => setEditOpen(false)} />
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
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
