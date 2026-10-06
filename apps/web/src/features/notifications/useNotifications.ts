import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { dataSource } from '../../services/index.js';
import type { AppNotification } from './types.js';

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    dataSource
      .listNotifications(userId)
      .then((list) => {
        if (!cancelled) setNotifications(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications(await dataSource.markNotificationsRead(userId));
  }, [userId]);

  return { notifications, hasUnread: notifications.some((n) => !n.read), markAllRead };
}
