import { useRef } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Icon } from '../../../components/Icon.js';
import { useToast } from '../../../components/ToastProvider.js';
import type { ProDocument } from '../../discovery/types.js';

interface DocsOverlayProps {
  open: boolean;
  docs: ProDocument[];
  onClose: () => void;
  onAdd: (doc: Omit<ProDocument, 'id'>) => void;
  onRemove: (docId: string) => void;
}

const MAX_DOCS = 10;
const MAX_SIZE = 10 * 1_048_576;

function fmtSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function DocsOverlay({ open, docs, onClose, onAdd, onRemove }: DocsOverlayProps) {
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    let rejected = 0;
    let count = docs.length;
    files.forEach((file) => {
      const ext = (file.name.split('.').pop() ?? '').toLowerCase();
      const type = file.type || (ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : '');
      if (!['application/pdf', 'image/png'].includes(type) || file.size > MAX_SIZE || count >= MAX_DOCS) {
        rejected++;
        return;
      }
      count++;
      onAdd({ name: file.name, size: file.size, type });
    });
    if (rejected) toast(`${rejected} arquivo(s) recusado(s) (PDF/PNG, até 10 MB, máx. ${MAX_DOCS} arquivos)`);
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between" style={{ marginBottom: 8 }}>
        <h2 className="h2">Documentações profissionais</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      <p className="small muted" style={{ margin: '-6px 0 16px' }}>
        Certificações, cursos e comprovantes de qualificação. PDF ou PNG, até 10 arquivos.
      </p>

      {docs.length > 0 && (
        <div className="list" style={{ marginBottom: 12 }}>
          {docs.map((d) => (
            <div className="doc-row" key={d.id}>
              <Icon name="file-text" />
              <div className="pro-body">
                <p className="h3 ell">{d.name}</p>
                <p className="tiny muted">
                  {d.type === 'application/pdf' ? 'PDF' : 'PNG'} · {fmtSize(d.size)}
                </p>
              </div>
              <button className="icon-btn" onClick={() => onRemove(d.id)} aria-label="Remover">
                <Icon name="trash" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/png,.pdf,.png"
        multiple
        className="hidden-input"
        onChange={handleFiles}
      />
      <button
        type="button"
        className="upload-btn"
        disabled={docs.length >= MAX_DOCS}
        onClick={() => fileInput.current?.click()}
      >
        <Icon name="upload" />
        Anexar arquivos ({docs.length}/{MAX_DOCS})
      </button>
    </Overlay>
  );
}
