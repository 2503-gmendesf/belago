import { NavLink } from 'react-router-dom';
import { Icon } from './Icon.js';

export interface TabBarItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

interface TabBarProps {
  items: TabBarItem[];
  ariaLabel: string;
}

export function TabBar({ items, ariaLabel }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label={ariaLabel}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `tab-btn${isActive ? ' tab-btn-active' : ''}`}
        >
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
