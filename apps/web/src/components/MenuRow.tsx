import type { ReactNode } from 'react';
import { Icon } from './Icon.js';

interface MenuRowProps {
  icon?: string;
  label: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export function MenuRow({ icon, label, value, onClick, danger = false }: MenuRowProps) {
  return (
    <button
      type="button"
      className={`menu-row${danger ? ' menu-row-danger' : ''}`}
      onClick={onClick}
    >
      {icon && <Icon name={icon} className="menu-row-icon" />}
      <span className="menu-row-label">{label}</span>
      {value !== undefined && <span className="menu-row-value muted small">{value}</span>}
      <Icon name="chevron-right" className="menu-row-chevron" />
    </button>
  );
}
