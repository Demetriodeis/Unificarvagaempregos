import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types';
import { addNotificationResponseListener, rescheduleAllAlerts } from './src/services/notificationService';
import { loadIdeas, loadSettings } from './src/services/storageService';

import HomeScreen from './src/screens/HomeScreen';
import AddIdeaScreen from './src/screens/AddIdeaScreen';
import IdeaDetailScreen from './src/screens/IdeaDetailScreen';
import EditIdeaScreen from './src/screens/EditIdeaScreen';
import AlertSettingsScreen from './src/screens/AlertSettingsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    // Reschedule alerts on app launch in case OS cleared them
    loadSettings().then((settings) => {
      if (settings.notificationsEnabled) {
        loadIdeas().then(rescheduleAllAlerts);
      }
    });

    // Navigate to idea when user taps a notification
    const subscription = addNotificationResponseListener((ideaId) => {
      navigationRef.current?.navigate('IdeaDetail', { ideaId });
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddIdea" component={AddIdeaScreen} />
        <Stack.Screen name="IdeaDetail" component={IdeaDetailScreen} />
        <Stack.Screen name="EditIdea" component={EditIdeaScreen} />
        <Stack.Screen name="AlertSettings" component={AlertSettingsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
