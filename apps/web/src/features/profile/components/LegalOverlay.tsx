import { CFG } from '@belago/shared';
import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { FaqAccordion } from './FaqAccordion.js';

interface LegalOverlayProps {
  open: boolean;
  onClose: () => void;
  onRequestDelete: () => void;
}

const lateFeePct = Math.round(CFG.lateCancelPenaltyRate * 100);

const DOCS: Array<[string, JSX.Element]> = [
  [
    'Política de Privacidade',
    <>
      <p>
        O BelaGo coleta nome, e-mail, telefone, endereço (quando você agenda um atendimento a domicílio),
        foto de perfil e dados de agendamento para viabilizar a conexão entre clientes e profissionais de
        beleza. Dados de pagamento são processados por provedores parceiros.
      </p>
      <p>
        Seus dados são usados para operar o agendamento e o histórico, permitir avaliações, enviar
        notificações e melhorar a segurança. Não vendemos dados pessoais a terceiros.
      </p>
      <p>
        Você pode acessar, corrigir ou solicitar a exclusão dos seus dados a qualquer momento, conforme a
        LGPD (Lei 13.709/2018), pelo e-mail privacidade@belago.app.
      </p>
    </>,
  ],
  [
    'Termos de Uso',
    <>
      <p>
        Ao usar o BelaGo você concorda em fornecer informações verdadeiras e tratar clientes e
        profissionais com respeito. O BelaGo atua como plataforma de intermediação: a prestação do
        serviço é de responsabilidade da profissional contratada.
      </p>
      <p>O uso indevido da plataforma (fraude, assédio, dados falsos) pode levar à suspensão da conta.</p>
    </>,
  ],
  [
    'Política de Cancelamento',
    <>
      <p>
        Cancelamentos feitos com mais de {CFG.lateCancelHours}h de antecedência do horário agendado não
        têm custo.
      </p>
      <p>
        Cancelamentos com menos de {CFG.lateCancelHours}h podem gerar cobrança de {lateFeePct}% do valor
        do serviço.
      </p>
      <p>
        Alterações de preço, duração ou disponibilidade feitas pela profissional não afetam agendamentos
        já confirmados.
      </p>
    </>,
  ],
];

export function LegalOverlay({ open, onClose, onRequestDelete }: LegalOverlayProps) {
  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between sheet-hd">
        <h2 className="h2">Privacidade e termos</h2>
        <button className="icon-btn flat" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <FaqAccordion items={DOCS} />
      <p className="tiny faint" style={{ marginTop: 14 }}>
        Última atualização: setembro de 2026.
      </p>
      <Button variant="danger" style={{ marginTop: 20 }} onClick={onRequestDelete}>
        <Icon name="trash" />
        Excluir minha conta
      </Button>
    </Overlay>
  );
}
