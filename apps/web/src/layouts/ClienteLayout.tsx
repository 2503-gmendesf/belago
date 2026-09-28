import { Outlet } from 'react-router-dom';
import { TabBar, type TabBarItem } from '../components/TabBar.js';

const ITEMS: TabBarItem[] = [
  { to: '/cliente', label: 'Início', icon: 'home', end: true },
  { to: '/cliente/explorar', label: 'Explorar', icon: 'search' },
  { to: '/cliente/agenda', label: 'Agenda', icon: 'calendar' },
  { to: '/cliente/perfil', label: 'Perfil', icon: 'user' },
];

export function ClienteLayout() {
  return (
    <div className="app">
      <div className="screen">
        <Outlet />
      </div>
      <TabBar items={ITEMS} ariaLabel="Navegação do cliente" />
    </div>
  );
}
