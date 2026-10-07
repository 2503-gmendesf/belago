import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { useToast } from '../../../components/ToastProvider.js';
import { env } from '../../../env.js';
import { FaqAccordion } from './FaqAccordion.js';
import { useRates } from '../../../context/ratesContext.js';
import { faqClient } from '../faqData.js';

interface HelpOverlayProps {
  open: boolean;
  onClose: () => void;
  faq?: Array<[string, string]>;
}

export function HelpOverlay({ open, onClose, faq }: HelpOverlayProps) {
  const { toast } = useToast();
  const rates = useRates();
  const items = faq ?? faqClient(rates);

  function openSupport() {
    const digits = env.supportWhatsapp.replace(/\D/g, '');
    if (!digits) {
      toast('Contato de suporte ainda não configurado');
      return;
    }
    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent('Olá! Preciso de ajuda com o BelaGo.')}`,
      '_blank',
      'noopener',
    );
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Ajuda e suporte</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <p className="eyebrow" style={{ marginBottom: 4 }}>
        Perguntas frequentes
      </p>
      <FaqAccordion items={items} />
      <Button style={{ marginTop: 20 }} onClick={openSupport}>
        <Icon name="chat" />
        Falar com o suporte no WhatsApp
      </Button>
    </Overlay>
  );
}
