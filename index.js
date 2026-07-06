/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {registerReminderNotificationBackgroundEvents} from './src/services/localNotificationService';

registerReminderNotificationBackgroundEvents();

AppRegistry.registerComponent(appName, () => App);
