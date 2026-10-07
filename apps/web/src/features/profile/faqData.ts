import { CFG, type PlatformRates } from '@belago/shared';
import { brl, pctLabel } from '../../lib/format.js';

export function faqPro(rates: PlatformRates): Array<[string, string]> {
  return [
    [
      'Como recebo pelos atendimentos?',
      `A plataforma cobra uma comissão de ${pctLabel(rates.commissionRate)}% por agendamento. O valor líquido é repassado conforme os dados de recebimento cadastrados no seu perfil.`,
    ],
    [
      'Como configuro minha disponibilidade?',
      'Na Agenda, aba Disponibilidade: escolha uma data e adicione os horários em que você atende, vinculando os serviços que podem ser agendados em cada um.',
    ],
    [
      'Posso desativar um serviço temporariamente?',
      'Sim, em Serviços. Um serviço inativo não aparece para agendamento, mas continua nos agendamentos já feitos com o mesmo nome, duração e preço.',
    ],
    [
      'O que acontece se um cliente cancelar em cima da hora?',
      `Cancelamentos com menos de ${CFG.lateCancelHours}h de antecedência podem gerar uma cobrança de ${pctLabel(rates.lateCancelPenaltyRate)}% do valor do serviço.`,
    ],
  ];
}

export function faqClient(rates: PlatformRates): Array<[string, string]> {
  return [
    [
      'Como funciona o agendamento?',
      'Escolha uma profissional, selecione o serviço, o dia e o horário disponíveis e confirme. O agendamento aparece na sua Agenda na hora.',
    ],
    [
      'Posso cancelar meu agendamento?',
      `Sim, pela Agenda. Cancelamentos com até ${CFG.lateCancelHours}h de antecedência ao horário não têm custo. Depois disso, pode haver cobrança de ${pctLabel(rates.lateCancelPenaltyRate)}% do valor.`,
    ],
    [
      'As profissionais são verificadas?',
      'Sim. Todas passam por verificação de documentos e análise de portfólio antes de serem aprovadas.',
    ],
    [
      'Como funciona o atendimento em domicílio?',
      `Quando a profissional oferece, você informa o endereço no agendamento. Há uma taxa de deslocamento de ${brl(rates.homeFee)}.`,
    ],
    [
      'Como avalio um atendimento?',
      'Depois do horário do serviço, o agendamento vai para o Histórico e você pode dar uma nota de 0 a 5 e deixar um comentário.',
    ],
  ];
}
