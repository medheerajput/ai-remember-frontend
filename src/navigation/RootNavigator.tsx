import React from 'react';
import {NavigationContainer, DarkTheme} from '@react-navigation/native';

import {useAuth} from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#070A12',
    card: '#0B1020',
    text: '#F9FAFB',
    border: '#1F2937',
    primary: '#8B5CF6',
  },
};

const RootNavigator = () => {
  const {isLoading, isAuthenticated} = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;