import { useEffect, useState } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Icon } from '../../../components/Icon.js';
import { Button } from '../../../components/Button.js';
import { useToast } from '../../../components/ToastProvider.js';
import { CATEGORIES } from '../../discovery/utils.js';
import type { ProService, ProServiceInput } from '../../discovery/types.js';
import type { Specialty } from '@belago/shared';

interface ServiceFormOverlayProps {
  open: boolean;
  service: ProService | null;
  onClose: () => void;
  onSave: (input: ProServiceInput, id?: string) => void;
  submitting: boolean;
}

export function ServiceFormOverlay({ open, service, onClose, onSave, submitting }: ServiceFormOverlayProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Specialty>('cabelo');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(service?.name ?? '');
    setCategory(service?.category ?? 'cabelo');
    setDuration(service ? String(service.durationMin) : '');
    setPrice(service ? String(service.price) : '');
    setActive(service ? service.active : true);
  }, [open, service]);

  function handleSave() {
    const dur = parseInt(duration, 10);
    const val = parseFloat(price);
    if (name.trim().length < 2) {
      toast('Informe o nome do serviço');
      return;
    }
    if (!(dur >= 5 && dur <= 600)) {
      toast('Duração entre 5 e 600 minutos');
      return;
    }
    if (!(val >= 0) || price.trim() === '') {
      toast('Informe o preço');
      return;
    }
    onSave({ name: name.trim(), category, durationMin: dur, price: val, active }, service?.id);
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">{service ? 'Editar serviço' : 'Novo serviço'}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <div className="field">
        <label>Nome</label>
        <input
          className="input"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Design de sobrancelha"
        />
      </div>
      <div className="field">
        <label>Categoria</label>
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value as Specialty)}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="rowf gap12">
        <div className="field" style={{ flex: 1 }}>
          <label>Duração (min)</label>
          <input
            className="input"
            type="number"
            min={5}
            max={600}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="45"
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Preço (R$)</label>
          <input
            className="input"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>
      <div className="rowf between" style={{ margin: '4px 0 20px' }}>
        <div>
          <p className="h3">Ativo</p>
          <p className="tiny muted">Só serviços ativos podem ser agendados</p>
        </div>
        <button
          type="button"
          className={`switch${active ? ' switch-on' : ''}`}
          aria-label="Ativo"
          onClick={() => setActive((a) => !a)}
        />
      </div>
      <Button disabled={submitting} onClick={handleSave}>
        Salvar serviço
      </Button>
    </Overlay>
  );
}
