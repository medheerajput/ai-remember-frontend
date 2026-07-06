import 'react-native-gesture-handler';

import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AuthProvider, useAuth} from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import {appTheme} from './src/theme/theme';

import {completeReminder} from './src/services/reminderApi';
import {registerReminderNotificationForegroundEvents} from './src/services/localNotificationService';

const AppNotificationEvents = () => {
  const {getIdToken} = useAuth() as any;

  useEffect(() => {
    const unsubscribe = registerReminderNotificationForegroundEvents({
      onDone: async reminderId => {
        try {
          const token = await getIdToken();

          if (!token) {
            return;
          }

          await completeReminder(token, reminderId);
        } catch (error) {
          console.log('Failed to complete reminder from notification:', error);
        }
      },
    });

    return unsubscribe;
  }, [getIdToken]);

  return null;
};

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <AuthProvider>
          <StatusBar barStyle="light-content" backgroundColor="#070A12" />

          <AppNotificationEvents />

          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;