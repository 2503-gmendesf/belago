import { Overlay } from '../../components/Overlay.js';
import { Button } from '../../components/Button.js';
import { Icon } from '../../components/Icon.js';
import { ago } from '../../lib/format.js';
import { NOTIFICATION_ICON, type AppNotification } from './types.js';
import './notifications.css';

interface NotificationsOverlayProps {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export function NotificationsOverlay({ open, onClose, notifications, onMarkAllRead }: NotificationsOverlayProps) {
  return (
    <Overlay open={open} onClose={onClose}>
      <div className="rowf between sheet-hd">
        <h2 className="h2">Notificações</h2>
        <button className="icon-btn flat" onClick={onClose} aria-label="Fechar">
          <Icon name="x" />
        </button>
      </div>
      {notifications.length ? (
        <>
          {notifications.map((n) => (
            <div key={n.id} className={`notif${n.read ? '' : ' unread'}`}>
              <div className="notif-ico">
                <Icon name={NOTIFICATION_ICON[n.type] ?? 'info'} />
              </div>
              <div className="notif-body">
                <p className="h3 notif-ttl">{n.title}</p>
                <p className="small muted">{n.body}</p>
                <p className="tiny faint" style={{ marginTop: 2 }}>
                  {ago(n.at)}
                </p>
              </div>
            </div>
          ))}
          <Button variant="sec" style={{ marginTop: 16 }} onClick={onMarkAllRead}>
            Marcar todas como lidas
          </Button>
        </>
      ) : (
        <div className="empty">
          <Icon name="bell" />
          <p>Nenhuma notificação</p>
        </div>
      )}
    </Overlay>
  );
}
