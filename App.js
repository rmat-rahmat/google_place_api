import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import MapViewScreen from './components/MapViewScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchListScreen from './components/SearchListScreen'; // Assuming you have a SearchListScreen component



const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
       <Stack.Navigator>
      <Stack.Screen name="Home" component={MapViewScreen} options={{headerShown:false}} />
      <Stack.Screen name="SearchList" component={SearchListScreen} />
    </Stack.Navigator>
    </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
