import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { Alert, Idea } from '../types';
import { updateIdea, getIdeaById } from './storageService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('ideas', {
      name: 'Ideias',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAlert(
  idea: Idea,
  alert: Alert
): Promise<string | null> {
  if (alert.stopped || !alert.enabled) return null;

  const scheduledDate = new Date(alert.scheduledDate);
  if (scheduledDate <= new Date()) return null;

  try {
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💡 ${idea.title}`,
        body: alert.message || 'Você tem uma ideia esperando sua atenção!',
        data: { ideaId: idea.id, alertId: alert.id },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
    });
    return notifId;
  } catch {
    return null;
  }
}

export async function cancelAlert(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllIdeaAlerts(idea: Idea): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => n.content.data?.ideaId === idea.id
  );
  await Promise.all(toCancel.map((n) => cancelAlert(n.identifier)));
}

export async function stopAlert(ideaId: string, alertId: string): Promise<void> {
  const idea = await getIdeaById(ideaId);
  if (!idea) return;

  // Cancel the OS notification
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const match = scheduled.find(
    (n) => n.content.data?.ideaId === ideaId && n.content.data?.alertId === alertId
  );
  if (match) await cancelAlert(match.identifier);

  // Mark alert as stopped in storage
  const updatedAlerts = idea.alerts.map((a) =>
    a.id === alertId ? { ...a, stopped: true, enabled: false } : a
  );
  await updateIdea({ ...idea, alerts: updatedAlerts });
}

export async function stopAllAlertsForIdea(ideaId: string): Promise<void> {
  const idea = await getIdeaById(ideaId);
  if (!idea) return;

  await cancelAllIdeaAlerts(idea);

  const updatedAlerts = idea.alerts.map((a) => ({
    ...a,
    stopped: true,
    enabled: false,
  }));
  await updateIdea({ ...idea, alerts: updatedAlerts });
}

export async function rescheduleAllAlerts(ideas: Idea[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const idea of ideas) {
    for (const alert of idea.alerts) {
      if (!alert.stopped && alert.enabled) {
        await scheduleAlert(idea, alert);
      }
    }
  }
}

// Listener for when user taps a notification
export function addNotificationResponseListener(
  callback: (ideaId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const ideaId = response.notification.request.content.data?.ideaId as string;
    if (ideaId) callback(ideaId);
  });
}
