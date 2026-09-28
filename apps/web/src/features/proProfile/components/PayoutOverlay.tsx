import { useEffect, useState } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { useToast } from '../../../components/ToastProvider.js';
import type { Professional, ProBankInfo, ProPixInfo } from '../../discovery/types.js';

interface PayoutOverlayProps {
  open: boolean;
  professional: Professional | null;
  onClose: () => void;
  onSave: (pix: ProPixInfo, bank: ProBankInfo) => void;
  submitting: boolean;
}

const PIX_TYPES: Array<[ProPixInfo['type'], string]> = [
  ['cpf', 'CPF'],
  ['cnpj', 'CNPJ'],
  ['email', 'E-mail'],
  ['phone', 'Telefone'],
  ['random', 'Chave aleatória'],
];

const ACCOUNT_TYPES: Array<[ProBankInfo['type'], string]> = [
  ['corrente', 'Conta corrente'],
  ['poupanca', 'Poupança'],
  ['pagamento', 'Conta de pagamento'],
];

function validPixKey(type: ProPixInfo['type'], key: string): boolean {
  if (!key) return true;
  const digits = key.replace(/\D/g, '');
  switch (type) {
    case 'cpf':
      return digits.length === 11;
    case 'cnpj':
      return digits.length === 14;
    case 'email':
      return /^\S+@\S+\.\S+$/.test(key);
    case 'phone':
      return digits.length >= 10 && digits.length <= 13;
    case 'random':
      return key.length >= 32;
    default:
      return true;
  }
}

export function PayoutOverlay({ open, professional: p, onClose, onSave, submitting }: PayoutOverlayProps) {
  const { toast } = useToast();
  const [pixType, setPixType] = useState<ProPixInfo['type']>('cpf');
  const [pixKey, setPixKey] = useState('');
  const [bank, setBank] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [accountType, setAccountType] = useState<ProBankInfo['type']>('corrente');

  useEffect(() => {
    if (open && p) {
      setPixType(p.pix.type);
      setPixKey(p.pix.key);
      setBank(p.bank.bank);
      setAgency(p.bank.agency);
      setAccount(p.bank.account);
      setAccountType(p.bank.type);
    }
  }, [open, p]);

  function handleSave() {
    if (!validPixKey(pixType, pixKey.trim())) {
      toast('Chave PIX inválida para o tipo escolhido');
      return;
    }
    onSave(
      { type: pixType, key: pixKey.trim() },
      { bank: bank.trim(), agency: agency.trim(), account: account.trim(), type: accountType },
    );
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Dados para recebimento</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <p className="small muted" style={{ margin: '-6px 0 18px' }}>
        Usados para repasses de pagamento. Seus dados ficam protegidos.
      </p>

      <p className="eyebrow" style={{ marginBottom: 8 }}>
        PIX
      </p>
      <div className="field">
        <label>Tipo de chave</label>
        <select className="select" value={pixType} onChange={(e) => setPixType(e.target.value as ProPixInfo['type'])}>
          {PIX_TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Chave PIX</label>
        <input className="input" autoComplete="off" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
      </div>

      <p className="eyebrow" style={{ margin: '20px 0 8px' }}>
        Conta bancária
      </p>
      <div className="field">
        <label>Banco</label>
        <input className="input" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Ex.: 260 – Nubank" />
      </div>
      <div className="rowf gap12">
        <div className="field" style={{ flex: 1 }}>
          <label>Agência</label>
          <input className="input" inputMode="numeric" value={agency} onChange={(e) => setAgency(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Conta</label>
          <input className="input" value={account} onChange={(e) => setAccount(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Tipo de conta</label>
        <select
          className="select"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as ProBankInfo['type'])}
        >
          {ACCOUNT_TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <Button disabled={submitting} onClick={handleSave} style={{ marginTop: 8 }}>
        Salvar
      </Button>
    </Overlay>
  );
}
