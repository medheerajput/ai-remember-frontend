import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import RememberScreen from '../screens/main/RememberScreen';
import AskAiScreen from '../screens/main/AskAiScreen';
import ReminderListScreen from '../screens/main/ReminderListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

export type MainTabParamList = {
  Remember: undefined;
  AskAI: undefined;
  Reminders: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#070A12',
        },
        headerTintColor: '#F9FAFB',
        tabBarStyle: {
          backgroundColor: '#0B1020',
          borderTopColor: '#1F2937',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
      }}>
      <Tab.Screen name="Remember" component={RememberScreen} />
      <Tab.Screen name="AskAI" component={AskAiScreen} options={{title: 'Ask AI'}} />
      <Tab.Screen name="Reminders" component={ReminderListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;