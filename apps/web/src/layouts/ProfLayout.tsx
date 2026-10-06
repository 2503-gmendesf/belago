import { Outlet, useLocation } from 'react-router-dom';
import { TabBar, type TabBarItem } from '../components/TabBar.js';

const ITEMS: TabBarItem[] = [
  { to: '/profissional', label: 'Início', icon: 'home', end: true },
  { to: '/profissional/agenda', label: 'Agenda', icon: 'calendar' },
  { to: '/profissional/financeiro', label: 'Financeiro', icon: 'wallet' },
  { to: '/profissional/servicos', label: 'Serviços', icon: 'layers' },
  { to: '/profissional/perfil', label: 'Perfil', icon: 'user' },
];

export function ProfLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app">
      <div className="screen" key={pathname}>
        <Outlet />
      </div>
      <TabBar items={ITEMS} ariaLabel="Navegação da profissional" />
    </div>
  );
}
