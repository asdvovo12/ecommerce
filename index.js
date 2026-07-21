// index.js
// Single source of truth for the app entry point.
//
// Previously this file contained a SECOND, older copy of the app while the
// complete app (with bottom tabs + StripeProvider) lived in App.js and was
// never used. Now the full app in App.js is the only entry, registered here
// for bare/managed Expo builds. In Expo Snack, App.js is used directly.

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
