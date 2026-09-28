import { useEffect, useRef, useState } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { useToast } from '../../../components/ToastProvider.js';
import { readImageAsDataUrl } from '../../../lib/image.js';
import type { Professional } from '../../discovery/types.js';
import type { ProProfileBasicInput } from '../../../services/types.js';

interface EditProOverlayProps {
  open: boolean;
  professional: Professional | null;
  onClose: () => void;
  onSave: (input: ProProfileBasicInput) => void;
  submitting: boolean;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function EditProOverlay({ open, professional: p, onClose, onSave, submitting }: EditProOverlayProps) {
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    if (open && p) {
      setName(p.name);
      setEmail(p.email);
      setPhone(p.phone);
      setCity(p.city);
      setAddress(p.address);
      setPhotoUrl(p.photoUrl);
    }
  }, [open, p]);

  async function handlePickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUrl(await readImageAsDataUrl(file, 500));
    } catch {
      toast('Não foi possível ler a imagem');
    } finally {
      e.target.value = '';
    }
  }

  function handleSave() {
    if (name.trim().length < 2) {
      toast('Informe seu nome');
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast('E-mail inválido');
      return;
    }
    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim(),
      photoUrl,
    });
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Editar perfil</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>

      <div className="center" style={{ marginBottom: 18 }}>
        <div
          className="avatar avatar-lg"
          style={{ margin: '0 auto 10px', backgroundImage: photoUrl ? `url('${photoUrl}')` : undefined }}
        >
          {photoUrl ? '' : initials(name || 'U')}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden-input"
          onChange={handlePickPhoto}
        />
        <Button variant="sec" size="sm" onClick={() => fileInput.current?.click()}>
          <Icon name="camera" />
          Alterar foto
        </Button>
      </div>

      <div className="field">
        <label>Nome</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>E-mail</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label>Telefone / WhatsApp</label>
        <input
          className="input"
          type="tel"
          placeholder="(31) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Cidade</label>
        <input
          className="input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Belo Horizonte, MG"
        />
      </div>
      <div className="field">
        <label>Endereço de atendimento</label>
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <Button disabled={submitting} onClick={handleSave} style={{ marginTop: 8 }}>
        Salvar alterações
      </Button>
    </Overlay>
  );
}
