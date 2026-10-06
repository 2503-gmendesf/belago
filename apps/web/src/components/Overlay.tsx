import type { ReactNode } from 'react';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  full?: boolean;
}

export function Overlay({ open, onClose, children, full = false }: OverlayProps) {
  if (!open) return null;
  return (
    <div
      className="overlay overlay-open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`sheet${full ? ' sheet-full' : ''}`}>
        {!full && <div className="grab" />}
        {children}
      </div>
    </div>
  );
}
