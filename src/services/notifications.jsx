import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(userId) {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission not granted for push notifications');
    return null;
  }

  // Get push token
 const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: 'bfaef68b-9092-42d7-86ae-1f4e3dcd05b6',
});
  const token = tokenData.data;

  if (userId) {
    // Save token to database
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: token,
        device_type: Platform.OS,
        is_active: true,
        updated_at: new Date(),
      }, { onConflict: 'token' });

    if (error) {
      console.error('Error saving push token:', error.message);
    } else {
      console.log('Push token registered for user:', userId);
    }
  }

  return token;
}

export function setupNotificationListeners(navigation) {
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
  });

  // Handle notification tap (when user taps notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;

    // Navigate based on notification type
    if (data?.type === 'message' && data?.conversationId) {
      navigation.navigate('Messages', {
        recipientId: data.conversationId,
        recipientName: data.senderName,
      });
    } else if (data?.type === 'order_update' && data?.orderId) {
      navigation.navigate('OrderDetails', { orderId: data.orderId });
    } else if (data?.type === 'booking') {
      navigation.navigate('ServiceProviderBookings');
    } else if (data?.type === 'payment') {
      navigation.navigate('MyWallet');
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

// Function to send a push notification (call this from Edge Function or backend)
export async function sendPushNotification(expoPushToken, title, body, data = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Send notification to a specific user
export async function notifyUser(userId, title, body, data = {}) {
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (tokens && tokens.length > 0) {
    const promises = tokens.map(t => sendPushNotification(t.token, title, body, data));
    await Promise.all(promises);
  }
}