import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import MatchDetailScreen from './src/screens/MatchDetailScreen';

export type RootStackParamList = {
  Home: undefined;
  MatchDetail: {
    eventId: string;
    league: string;
    homeName: string;
    awayName: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#EEF2FF',
    card: '#FFFFFF',
    text: '#0F172A',
    primary: '#1D4ED8',
    border: '#D1D5DB',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={appTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'UVI LiveScore',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
          }}
        />
        <Stack.Screen
          name="MatchDetail"
          component={MatchDetailScreen}
          options={{
            title: 'Chi tiết trận đấu',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
