import { useEffect, useState } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Icon } from '../../../components/Icon.js';
import { Button } from '../../../components/Button.js';
import { useToast } from '../../../components/ToastProvider.js';
import { todayISO } from '../../../lib/format.js';
import { EXPENSE_CATEGORIES } from '../types.js';
import type { CreateExpenseInput } from '../types.js';

interface ExpenseFormOverlayProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: CreateExpenseInput) => void;
  submitting: boolean;
}

export function ExpenseFormOverlay({ open, onClose, onSave, submitting }: ExpenseFormOverlayProps) {
  const { toast } = useToast();
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [cat, setCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    if (!open) return;
    setDesc('');
    setVal('');
    setCat(EXPENSE_CATEGORIES[0]);
    setDate(todayISO());
  }, [open]);

  function handleSave() {
    const value = parseFloat(val);
    if (!desc.trim() || !(value > 0) || !date) {
      toast('Preencha descrição, valor e data');
      return;
    }
    onSave({ desc: desc.trim(), val: value, cat, date });
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Registrar despesa</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <div className="field">
        <label>Descrição</label>
        <input
          className="input"
          maxLength={80}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Ex.: material de sobrancelha"
        />
      </div>
      <div className="field">
        <label>Valor (R$)</label>
        <input
          className="input"
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="0,00"
        />
      </div>
      <div className="field">
        <label>Categoria</label>
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Data</label>
        <input
          className="input"
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <Button disabled={submitting} onClick={handleSave} style={{ marginTop: 8 }}>
        Salvar despesa
      </Button>
    </Overlay>
  );
}
