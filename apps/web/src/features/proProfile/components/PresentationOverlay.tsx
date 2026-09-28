import { useEffect, useRef, useState } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import { useToast } from '../../../components/ToastProvider.js';
import { readImageAsDataUrl } from '../../../lib/image.js';
import type { Professional } from '../../discovery/types.js';
import type { ProPresentationInput } from '../../../services/types.js';

interface PresentationOverlayProps {
  open: boolean;
  professional: Professional | null;
  onClose: () => void;
  onSave: (input: ProPresentationInput) => void;
  submitting: boolean;
}

const SOCIAL_FIELDS: Array<[keyof Professional['socials'], string, string]> = [
  ['instagram', 'Instagram', 'instagram'],
  ['youtube', 'YouTube', 'youtube'],
  ['tiktok', 'TikTok', 'tiktok'],
  ['facebook', 'Facebook', 'facebook'],
];

const MAX_PHOTOS = 12;

export function PresentationOverlay({ open, professional: p, onClose, onSave, submitting }: PresentationOverlayProps) {
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [socials, setSocials] = useState<Professional['socials']>({});

  useEffect(() => {
    if (open && p) {
      setBio(p.bio);
      setPhotos(p.photos);
      setSocials(p.socials);
    }
  }, [open, p]);

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    let bad = 0;
    const next = [...photos];
    for (const file of files) {
      if (next.length >= MAX_PHOTOS) {
        toast(`Limite de ${MAX_PHOTOS} fotos`);
        break;
      }
      try {
        next.push(await readImageAsDataUrl(file, 900));
      } catch {
        bad++;
      }
    }
    setPhotos(next);
    if (bad) toast('Alguns arquivos não são imagens válidas');
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    onSave({ bio: bio.trim(), photos, socials });
  }

  return (
    <Overlay open={open} onClose={onClose} full>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Apresentação profissional</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>

      <div className="field">
        <label>Bio</label>
        <textarea
          className="textarea"
          maxLength={500}
          placeholder="Conte sua experiência e especialidades"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <span className="tiny faint">Aparece no seu perfil público para os clientes.</span>
      </div>

      <p className="eyebrow" style={{ margin: '20px 0 8px' }}>
        Fotos
      </p>
      <div className="photo-grid">
        {photos.map((url, i) => (
          <div className="ph" style={{ backgroundImage: `url('${url}')` }} key={i}>
            <button onClick={() => removePhoto(i)} aria-label="Remover foto">
              <Icon name="x" />
            </button>
          </div>
        ))}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden-input"
        onChange={handleAddPhotos}
      />
      <button
        type="button"
        className="upload-btn"
        style={{ marginTop: photos.length ? 10 : 0 }}
        onClick={() => fileInput.current?.click()}
      >
        <Icon name="upload" />
        Adicionar fotos ({photos.length}/{MAX_PHOTOS})
      </button>

      <p className="eyebrow" style={{ margin: '22px 0 8px' }}>
        Redes sociais (opcional)
      </p>
      {SOCIAL_FIELDS.map(([key, label, icon]) => (
        <div className="field" key={key}>
          <label>{label}</label>
          <div className="search-box">
            <Icon name={icon} />
            <input
              value={socials[key] ?? ''}
              onChange={(e) => setSocials((s) => ({ ...s, [key]: e.target.value }))}
              placeholder="@usuario ou link"
            />
          </div>
        </div>
      ))}

      <Button disabled={submitting} onClick={handleSave} style={{ marginTop: 8 }}>
        Salvar
      </Button>
    </Overlay>
  );
}
