import { useEffect, useRef, useState } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { useAuth } from '../../../context/AuthContext.js';
import { useToast } from '../../../components/ToastProvider.js';
import { readImageAsDataUrl } from '../../../lib/image.js';

interface EditProfileOverlayProps {
  open: boolean;
  onClose: () => void;
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

export function EditProfileOverlay({ open, onClose }: EditProfileOverlayProps) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setPhotoUrl(user.photoUrl);
    }
  }, [open, user]);

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

  async function handleSave() {
    if (name.trim().length < 2) {
      toast('Informe seu nome');
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast('E-mail inválido');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim(), photoUrl });
      toast('Perfil atualizado');
      onClose();
    } finally {
      setSaving(false);
    }
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
          style={{
            margin: '0 auto 10px',
            backgroundImage: photoUrl ? `url('${photoUrl}')` : undefined,
          }}
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
        <label>Nome completo</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>E-mail</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label>Telefone</label>
        <input
          className="input"
          type="tel"
          placeholder="(31) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <Button disabled={saving} onClick={handleSave} style={{ marginTop: 8 }}>
        Salvar alterações
      </Button>
    </Overlay>
  );
}
