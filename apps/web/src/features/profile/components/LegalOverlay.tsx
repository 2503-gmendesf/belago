import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';

interface LegalOverlayProps {
  open: boolean;
  onClose: () => void;
  onRequestDelete: () => void;
}

export function LegalOverlay({ open, onClose, onRequestDelete }: LegalOverlayProps) {
  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Privacidade e Termos</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <p className="small muted" style={{ margin: '8px 0 20px' }}>
        Leia a Política de Privacidade e os Termos de Uso completos, incluindo como tratamos seus
        dados conforme a LGPD.
      </p>
      <a
        className="btn btn-sec"
        style={{ marginBottom: 10, textDecoration: 'none' }}
        href="/legal"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="file-text" />
        Ver documento completo
      </a>
      <Button variant="danger" onClick={onRequestDelete}>
        <Icon name="trash" />
        Excluir minha conta
      </Button>
    </Overlay>
  );
}
