import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing, Smartphone } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { saveSubscription, deleteSubscription } from '../services/pushService';
import { personName, partnerOf } from '../utils/identity';
import {
  enablePush,
  disablePush,
  getExistingSubscription,
  getPermission,
  pushBlockedReason
} from '../utils/push';

/**
 * Activar/desactivar los avisos del otro.
 *
 * En iOS el permiso sólo se puede pedir desde un tap real y sólo si la app
 * está instalada, así que en vez de un botón que falle en silencio esto
 * explica qué falta hacer.
 */
const NotificationsCard = ({ identity }) => {
  const [isOn, setIsOn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const blockedReason = pushBlockedReason();
  const partnerName = personName(partnerOf(identity));

  useEffect(() => {
    let cancelled = false;
    getExistingSubscription().then((sub) => {
      if (!cancelled) setIsOn(Boolean(sub));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = useCallback(async () => {
    setIsBusy(true);
    setError('');
    try {
      const subscription = await enablePush();
      if (!subscription) {
        setError(
          getPermission() === 'denied'
            ? 'Bloqueaste los avisos. Hay que habilitarlos desde los ajustes del teléfono.'
            : 'No se pudo activar. Probá de nuevo.'
        );
        return;
      }
      if (isSupabaseConfigured) {
        await saveSubscription(identity, subscription);
      }
      setIsOn(true);
    } catch (e) {
      console.error('Error activando las notificaciones:', e);
      setError('No se pudo activar. Probá de nuevo.');
    } finally {
      setIsBusy(false);
    }
  }, [identity]);

  const handleDisable = useCallback(async () => {
    setIsBusy(true);
    setError('');
    try {
      const subscription = await disablePush();
      if (subscription && isSupabaseConfigured) {
        await deleteSubscription(subscription.endpoint);
      }
      setIsOn(false);
    } catch (e) {
      console.error('Error desactivando las notificaciones:', e);
      setError('No se pudo desactivar. Probá de nuevo.');
    } finally {
      setIsBusy(false);
    }
  }, []);

  // iOS: sin instalar no hay push posible. Mejor decirlo que ofrecer un botón muerto.
  if (blockedReason === 'ios-necesita-instalar') {
    return (
      <div className="notif-card notif-card-hint">
        <span className="notif-card-icon">
          <Smartphone size={18} />
        </span>
        <div className="notif-card-text">
          <span className="notif-card-title">Avisos cuando {partnerName} agregue algo</span>
          <span className="notif-card-desc">
            Para que lleguen, primero hay que instalar la app en la pantalla de inicio.
          </span>
        </div>
      </div>
    );
  }

  if (blockedReason === 'no-soportado' || blockedReason === 'unconfigured') {
    return null;
  }

  return (
    <div className="notif-card">
      <span className={`notif-card-icon ${isOn ? 'active' : ''}`}>
        {isOn ? <BellRing size={18} /> : <Bell size={18} />}
      </span>

      <div className="notif-card-text">
        <span className="notif-card-title">
          {isOn ? 'Avisos activados' : `Avisos cuando ${partnerName} agregue algo`}
        </span>
        <span className="notif-card-desc">
          {error ||
            (isOn
              ? 'Te llega una notificación con cada cita o pendiente nuevo.'
              : 'Una notificación con cada cita o pendiente nuevo.')}
        </span>
      </div>

      <button
        type="button"
        className={`notif-card-btn ${isOn ? 'is-on' : ''}`}
        onClick={isOn ? handleDisable : handleEnable}
        disabled={isBusy}
      >
        {isBusy ? '...' : isOn ? <BellOff size={15} /> : 'Activar'}
      </button>
    </div>
  );
};

export default NotificationsCard;
