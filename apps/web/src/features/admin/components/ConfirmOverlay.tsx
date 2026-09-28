import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';

interface ConfirmOverlayProps {
  open: boolean;
  icon: string;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmOverlay({
  open,
  icon,
  title,
  description,
  confirmLabel,
  danger = false,
  submitting = false,
  onClose,
  onConfirm,
}: ConfirmOverlayProps) {
  return (
    <Overlay open={open} onClose={onClose}>
      <div className="center">
        <div className="confirm-ic">
          <Icon name={icon} />
        </div>
        <h2 className="h2">{title}</h2>
        <p className="muted small" style={{ margin: '8px 0 20px' }}>
          {description}
        </p>
      </div>
      <div className="stack gap8">
        <Button variant={danger ? 'danger' : 'primary'} disabled={submitting} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="sec" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Overlay>
  );
}
