import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
  EventType,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

import type {ApiReminder} from './reminderApi';

const REMINDER_CHANNEL_ID = 'remember_ai_alarm_v2';
const REMINDER_SOUND = 'reminder_alarm';
const VIBRATION_PATTERN = [300, 500, 300, 500, 700, 500];

const SNOOZE_MINUTES = 10;

const getNotificationId = (reminderId: string) => {
  return `reminder_${reminderId}`;
};

export const requestNotificationPermission = async () => {
  await notifee.requestPermission();
};

export const ensureReminderChannel = async () => {
  await notifee.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'Reminder alarms',
    importance: AndroidImportance.HIGH,
    sound: REMINDER_SOUND,
    vibration: true,
    vibrationPattern: VIBRATION_PATTERN,
    lights: true,
  });
};

export const checkAlarmPermission = async () => {
  const settings = await notifee.getNotificationSettings();

  if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
    console.log('Exact alarm permission is disabled.');
    await notifee.openAlarmPermissionSettings();
    return false;
  }

  return true;
};

const buildReminderNotification = (reminder: {
  id: string;
  title: string;
  description?: string | null;
}) => {
  return {
    id: getNotificationId(reminder.id),
    title: reminder.title || 'Reminder',
    body: reminder.description || 'You have a reminder.',
    android: {
      channelId: REMINDER_CHANNEL_ID,
      smallIcon: 'ic_launcher',

      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,

      sound: REMINDER_SOUND,
      vibrationPattern: VIBRATION_PATTERN,

      // Keeps notification visible until user acts.
      ongoing: true,
      autoCancel: false,

      pressAction: {
        id: 'default',
      },

      actions: [
        {
          title: 'Done',
          pressAction: {
            id: 'done',
          },
        },
        {
          title: `Snooze ${SNOOZE_MINUTES}m`,
          pressAction: {
            id: 'snooze',
          },
        },
      ],
    },
    data: {
      reminderId: reminder.id,
      title: reminder.title || 'Reminder',
      description: reminder.description || 'You have a reminder.',
    },
  };
};

export const showTestNotificationNow = async () => {
  await requestNotificationPermission();
  await ensureReminderChannel();

  await notifee.displayNotification(
    buildReminderNotification({
      id: 'test',
      title: 'Remember AI test alarm',
      description: 'Sound, vibration, Done and Snooze are working.',
    }),
  );
};

export const scheduleReminderNotification = async (
  reminder: ApiReminder,
): Promise<void> => {
  if (reminder.status !== 'pending') {
    await cancelReminderNotification(reminder.id);
    return;
  }

  const remindAt = new Date(reminder.remindAt);

  if (Number.isNaN(remindAt.getTime())) {
    console.log('Invalid reminder date:', reminder.remindAt);
    return;
  }

  const delayMs = remindAt.getTime() - Date.now();

  console.log('Scheduling reminder:', {
    id: reminder.id,
    title: reminder.title,
    remindAt: reminder.remindAt,
    delayMs,
  });

  if (delayMs <= 30_000) {
    console.log('Reminder time is too close or already past. Skipping schedule.');
    return;
  }

  await requestNotificationPermission();
  await ensureReminderChannel();

  const hasAlarmPermission = await checkAlarmPermission();

  if (!hasAlarmPermission) {
    return;
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: remindAt.getTime(),
    alarmManager: {
      allowWhileIdle: true,
    },
  };

  await notifee.createTriggerNotification(
    buildReminderNotification(reminder),
    trigger,
  );

  console.log('Reminder notification scheduled:', reminder.id);
};

export const snoozeReminderNotification = async ({
  reminderId,
  title,
  description,
  minutes = SNOOZE_MINUTES,
}: {
  reminderId: string;
  title: string;
  description?: string | null;
  minutes?: number;
}) => {
  await requestNotificationPermission();
  await ensureReminderChannel();

  await cancelReminderNotification(reminderId);

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + minutes * 60 * 1000,
    alarmManager: {
      allowWhileIdle: true,
    },
  };

  await notifee.createTriggerNotification(
    buildReminderNotification({
      id: reminderId,
      title,
      description,
    }),
    trigger,
  );
};

export const cancelReminderNotification = async (
  reminderId: string,
): Promise<void> => {
  const notificationId = getNotificationId(reminderId);

  await notifee.cancelTriggerNotification(notificationId);
  await notifee.cancelNotification(notificationId);
};

export const syncReminderNotifications = async (
  reminders: ApiReminder[],
): Promise<void> => {
  await requestNotificationPermission();
  await ensureReminderChannel();

  const pendingReminders = reminders.filter(
    reminder => reminder.status === 'pending',
  );

  for (const reminder of pendingReminders) {
    await scheduleReminderNotification(reminder);
  }
};

export const registerReminderNotificationForegroundEvents = ({
  onDone,
}: {
  onDone?: (reminderId: string) => Promise<void>;
}) => {
  return notifee.onForegroundEvent(async ({type, detail}) => {
    if (type !== EventType.ACTION_PRESS) {
      return;
    }

    const reminderId = detail.notification?.data?.reminderId as
      | string
      | undefined;

    if (!reminderId) {
      return;
    }

    if (detail.pressAction?.id === 'done') {
      await cancelReminderNotification(reminderId);

      if (onDone) {
        await onDone(reminderId);
      }
    }

    if (detail.pressAction?.id === 'snooze') {
      await snoozeReminderNotification({
        reminderId,
        title: String(detail.notification?.data?.title || 'Reminder'),
        description: String(
          detail.notification?.data?.description || 'You have a reminder.',
        ),
        minutes: SNOOZE_MINUTES,
      });
    }
  });
};

export const registerReminderNotificationBackgroundEvents = () => {
  notifee.onBackgroundEvent(async ({type, detail}) => {
    if (type !== EventType.ACTION_PRESS) {
      return;
    }

    const reminderId = detail.notification?.data?.reminderId as
      | string
      | undefined;

    if (!reminderId) {
      return;
    }

    if (detail.pressAction?.id === 'done') {
      await cancelReminderNotification(reminderId);
    }

    if (detail.pressAction?.id === 'snooze') {
      await snoozeReminderNotification({
        reminderId,
        title: String(detail.notification?.data?.title || 'Reminder'),
        description: String(
          detail.notification?.data?.description || 'You have a reminder.',
        ),
        minutes: SNOOZE_MINUTES,
      });
    }
  });
};