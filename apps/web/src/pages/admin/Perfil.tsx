import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ToastProvider.js';
import { dataSource } from '../../services/index.js';
import { LogoutOverlay } from '../../features/profile/components/LogoutOverlay.js';
import { brl } from '../../lib/format.js';

const SHORTCUTS: Array<[string, string, string]> = [
  ['grid', 'Painel de controle', '/admin'],
  ['scissors', 'Gestão de profissionais', '/admin/profissionais'],
  ['users', 'Gestão de clientes', '/admin/clientes'],
  ['wallet', 'Financeiro da plataforma', '/admin/financeiro'],
  ['settings', 'Configurações da plataforma', '/admin/config'],
];

export function Perfil() {
  const { user, doLogout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [professionalsCount, setProfessionalsCount] = useState<number | null>(null);
  const [gmvMonth, setGmvMonth] = useState<number | null>(null);

  useEffect(() => {
    dataSource.listAdminProfessionals().then((list) => setProfessionalsCount(list.length));
    dataSource.getAdminFinance('mes').then((snap) => setGmvMonth(snap.gmv));
  }, []);

  async function handleConfirmLogout() {
    await doLogout();
    toast('Até logo');
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <h1 className="h1">Perfil</h1>
      <div className="card" style={{ marginTop: 14, textAlign: 'center' }}>
        <div className="avatar avatar-lg" style={{ margin: '4px auto 12px' }}>
          AB
        </div>
        <h2 className="h2">{user?.name ?? 'Admin BelaGo'}</h2>
        <p className="small muted">{user?.email}</p>
        <span className="tag" style={{ marginTop: 10 }}>
          Administrador
        </span>
      </div>

      <div className="kpis-3" style={{ marginTop: 12 }}>
        <div className="kpi-mini">
          <p className="h3 num">{professionalsCount ?? '—'}</p>
          <p className="tiny muted">Profis.</p>
        </div>
        <div className="kpi-mini">
          <p className="h3 num">3.421</p>
          <p className="tiny muted">Clientes</p>
        </div>
        <div className="kpi-mini">
          <p className="h3 num">{gmvMonth !== null ? brl(gmvMonth) : '—'}</p>
          <p className="tiny muted">GMV/mês</p>
        </div>
      </div>

      <div className="list" style={{ marginTop: 16 }}>
        {SHORTCUTS.map(([icon, label, to]) => (
          <button className="li" key={to} onClick={() => navigate(to)}>
            <Icon name={icon} />
            <span className="pro-body h3">{label}</span>
            <Icon name="chevron-right" />
          </button>
        ))}
      </div>

      <button className="btn btn-danger" style={{ marginTop: 20 }} onClick={() => setLogoutOpen(true)}>
        <Icon name="logout" />
        Sair do admin
      </button>

      <LogoutOverlay open={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={handleConfirmLogout} />
    </div>
  );
}
