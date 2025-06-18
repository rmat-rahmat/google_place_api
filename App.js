import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import MapViewScreen from './screens/MapViewScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchListScreen from './screens/SearchListScreen';
import SearchHistoryScreen from './screens/SearchHistoryScreen';
import { PlaceProvider } from './context/PlaceContext';

const Stack = createNativeStackNavigator();

/**
 * App entry point. Sets up navigation, context providers, and status bar.
 */
export default function App() {

  return (
    <SafeAreaProvider>
      {/* PlaceProvider supplies place context to the app */}
      <PlaceProvider>
        <NavigationContainer>
          <Stack.Navigator>
            {/* Main map screen */}
            <Stack.Screen
              name="Home"
              component={MapViewScreen}
              options={{ headerShown: false }}
            />
            {/* Search results screen */}
            <Stack.Screen
              name="SearchList"
              component={SearchListScreen}
              options={{ title: "Search Result" }}
            />
            {/* Search history screen */}
            <Stack.Screen
              name="SearchHistory"
              component={SearchHistoryScreen}
              options={{ title: "Search History" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </PlaceProvider>
    </SafeAreaProvider>
  );
}
