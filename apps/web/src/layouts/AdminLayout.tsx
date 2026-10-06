import { Outlet, useLocation } from 'react-router-dom';
import { TabBar, type TabBarItem } from '../components/TabBar.js';

const ITEMS: TabBarItem[] = [
  { to: '/admin', label: 'Painel', icon: 'grid', end: true },
  { to: '/admin/profissionais', label: 'Profis.', icon: 'scissors' },
  { to: '/admin/clientes', label: 'Clientes', icon: 'users' },
  { to: '/admin/financeiro', label: 'Financeiro', icon: 'wallet' },
  { to: '/admin/config', label: 'Config.', icon: 'settings' },
  { to: '/admin/perfil', label: 'Perfil', icon: 'user' },
];

export function AdminLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app">
      <div className="screen" key={pathname}>
        <Outlet />
      </div>
      <TabBar items={ITEMS} ariaLabel="Navegação do admin" />
    </div>
  );
}
