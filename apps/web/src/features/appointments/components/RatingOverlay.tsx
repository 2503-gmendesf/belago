import { useEffect, useState } from 'react';
import { Overlay } from '../../../components/Overlay.js';
import { Button } from '../../../components/Button.js';
import { Icon } from '../../../components/Icon.js';
import type { AppointmentView } from '../types.js';

interface RatingOverlayProps {
  appointment: AppointmentView | null;
  onClose: () => void;
  onSubmit: (rating: number, text: string) => void;
  submitting: boolean;
}

export function RatingOverlay({ appointment: a, onClose, onSubmit, submitting }: RatingOverlayProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    if (a) {
      setRating(0);
      setText('');
    }
  }, [a]);

  return (
    <Overlay open={a !== null} onClose={onClose}>
      {a && (
        <div>
          <div className="rowf between" style={{ marginBottom: 8 }}>
            <h2 className="h2">Avaliar atendimento</h2>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">
              <Icon name="x" />
            </button>
          </div>
          <div className="rowf gap12">
            <div className="avatar">{a.professionalName.slice(0, 1)}</div>
            <div>
              <p className="h3">{a.professionalName}</p>
              <p className="small muted">{a.serviceName}</p>
            </div>
          </div>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                className={rating >= i ? 'lit' : ''}
                aria-label={`${i} estrelas`}
                onClick={() => setRating(rating === i ? i - 1 : i)}
              >
                <Icon name="star" />
              </button>
            ))}
          </div>
          <p className="center small muted">Nota: {rating} de 5</p>
          <div className="field" style={{ marginTop: 14 }}>
            <label>Observação (opcional)</label>
            <textarea
              className="textarea"
              maxLength={500}
              placeholder="Conte como foi"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <Button disabled={rating === 0 || submitting} onClick={() => onSubmit(rating, text.trim())}>
            Enviar avaliação
          </Button>
        </div>
      )}
    </Overlay>
  );
}
