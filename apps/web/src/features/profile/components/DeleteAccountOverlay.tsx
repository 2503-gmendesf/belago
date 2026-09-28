import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';

interface DeleteAccountOverlayProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

export function DeleteAccountOverlay({ open, onClose, onConfirm, submitting }: DeleteAccountOverlayProps) {
  return (
    <Overlay open={open} onClose={onClose}>
      <div className="center">
        <div className="confirm-ic">
          <Icon name="trash" />
        </div>
        <h2 className="h2">Excluir sua conta?</h2>
        <p className="muted small" style={{ margin: '8px 0 20px' }}>
          Essa ação é permanente. Seus dados de perfil, agendamentos e histórico serão apagados em
          até 7 dias, conforme nossa Política de Privacidade.
        </p>
      </div>
      <div className="stack gap8">
        <Button variant="danger" disabled={submitting} onClick={onConfirm}>
          Excluir minha conta
        </Button>
        <Button variant="sec" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Overlay>
  );
}
