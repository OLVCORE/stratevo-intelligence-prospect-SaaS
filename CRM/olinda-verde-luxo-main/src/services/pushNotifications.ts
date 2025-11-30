import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export const initializePushNotifications = async () => {
  // Request permission to use push notifications
  const permStatus = await PushNotifications.requestPermissions();
  
  if (permStatus.receive !== 'granted') {
    console.log('Push notification permission denied');
    return;
  }

  // Register with Apple / Google to receive push via APNS/FCM
  await PushNotifications.register();

  // On success, we should be able to receive notifications
  PushNotifications.addListener('registration', async (token) => {
    console.log('Push registration success, token: ' + token.value);
    
    // Save the token to the database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token: token.value,
          platform: 'fcm', // or 'apns' for iOS
          updated_at: new Date().toISOString()
        });
    }
  });

  // Some issue with our setup and push will not work
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Error on registration: ' + JSON.stringify(error));
  });

  // Show us the notification payload if the app is open on our device
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received: ', notification);
  });

  // Method called when tapping on a notification
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed', notification.actionId, notification.inputValue);
    
    // Navigate to leads page when notification is tapped
    if (notification.notification.data?.leadId) {
      window.location.href = `/admin/leads`;
    }
  });
};

export const checkPushNotificationPermissions = async () => {
  const permStatus = await PushNotifications.checkPermissions();
  return permStatus.receive === 'granted';
};
