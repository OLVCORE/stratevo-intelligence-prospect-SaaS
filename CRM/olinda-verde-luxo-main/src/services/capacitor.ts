import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const initializeCapacitor = async () => {
  if (!isNativePlatform()) {
    console.log('Running in browser mode');
    return;
  }

  try {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#059669' });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    // Handle deep links
    App.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data);
    });

    console.log('Capacitor initialized successfully');
  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
};

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (!isNativePlatform()) return;
  
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.error('Error triggering haptic:', error);
  }
};

export const exitApp = async () => {
  if (!isNativePlatform()) return;
  
  try {
    await App.exitApp();
  } catch (error) {
    console.error('Error exiting app:', error);
  }
};
