/**
 * App.tsx — Punto de entrada de Raín.
 * Navegación base: Native Stack con MainTabs y Chat.
 */
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Home, Wallet, CheckSquare, Calendar, Mic } from 'lucide-react-native';

import InicioScreen from './screens/InicioScreen';
import FinanzasScreen from './screens/FinanzasScreen';
import TareasScreen from './screens/TareasScreen';
import CalendarioScreen from './screens/CalendarioScreen';
import ChatScreen from './screens/ChatScreen';
import { ErrorBoundary } from './ErrorBoundary';

import { theme } from './theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Inicio') return <Home size={24} color={color} />;
          if (route.name === 'Finanzas') return <Wallet size={24} color={color} />;
          if (route.name === 'Tareas') return <CheckSquare size={24} color={color} />;
          if (route.name === 'Calendario') return <Calendar size={24} color={color} />;
          return null;
        },
        tabBarActiveTintColor: theme.colors.primaryContainer,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 24,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.semiBold,
          fontSize: 11,
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Finanzas" component={FinanzasScreen} />
      <Tab.Screen name="Tareas" component={TareasScreen} />
      <Tab.Screen name="Calendario" component={CalendarioScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B5CEB" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ presentation: 'modal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
