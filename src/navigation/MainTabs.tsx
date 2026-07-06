import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { MainTabParamList } from './types';

import ProfileScreen from '../screens/main/ProfileScreen';
import ChatScreen from '../screens/main/ChatScreen';
import RemindersScreen from '../screens/main/RemindersScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const getTabIcon = (routeName: keyof MainTabParamList, focused: boolean) => {
    const color = focused ? '#A78BFA' : '#6B7280';

    const iconMap: Record<keyof MainTabParamList, string> = {
        Chat: '💬',
        Reminders: '⏰',
        Profile: '👤',
    };

    return (
        <Text style={{ fontSize: 20, color }}>
            {iconMap[routeName]}
        </Text>
    );
};

const MainTabs = () => {
    return (
        <Tab.Navigator
            initialRouteName="Chat"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused }) =>
                    getTabIcon(route.name as keyof MainTabParamList, focused),
                tabBarActiveTintColor: '#A78BFA',
                tabBarInactiveTintColor: '#6B7280',
                tabBarStyle: {
                    backgroundColor: '#0B1020',
                    borderTopColor: '#1F2937',
                    height: 64,
                    paddingTop: 8,
                    paddingBottom: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            })}>
            <Tab.Screen name="Chat" component={ChatScreen} />
            <Tab.Screen name="Reminders" component={RemindersScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainTabs;