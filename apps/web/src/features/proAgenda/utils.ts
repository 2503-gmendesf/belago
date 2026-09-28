import { fromMinutes } from '../../lib/format.js';

/** Grade padrão de horários: 06:00 às 22:00, a cada 30 minutos. */
export const STD_TIMES: string[] = (() => {
  const times: string[] = [];
  for (let m = 360; m <= 1320; m += 30) times.push(fromMinutes(m));
  return times;
})();

export function whatsappUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  const target = digits ? (digits.startsWith('55') ? digits : `55${digits}`) : '';
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}
