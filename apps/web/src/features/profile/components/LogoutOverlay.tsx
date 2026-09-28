import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';

interface LogoutOverlayProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutOverlay({ open, onClose, onConfirm }: LogoutOverlayProps) {
  return (
    <Overlay open={open} onClose={onClose}>
      <div className="center">
        <div className="confirm-ic">
          <Icon name="logout" />
        </div>
        <h2 className="h2">Sair da conta?</h2>
        <p className="muted small" style={{ margin: '8px 0 20px' }}>
          Você precisará entrar novamente para acessar sua conta.
        </p>
      </div>
      <div className="stack gap8">
        <Button onClick={onConfirm}>Sair</Button>
        <Button variant="sec" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Overlay>
  );
}
