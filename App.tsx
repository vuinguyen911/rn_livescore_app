import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import MatchDetailScreen from './src/screens/MatchDetailScreen';
import { I18nProvider, useI18n } from './src/i18n';

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

const LanguageSwitch = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <View style={styles.langWrap}>
      <Pressable
        style={[styles.langBtn, locale === 'vi' && styles.langBtnActive]}
        onPress={() => setLocale('vi')}
      >
        <Text style={[styles.langText, locale === 'vi' && styles.langTextActive]}>{t.common.languageVi}</Text>
      </Pressable>
      <Pressable
        style={[styles.langBtn, locale === 'en' && styles.langBtnActive]}
        onPress={() => setLocale('en')}
      >
        <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>{t.common.languageEn}</Text>
      </Pressable>
    </View>
  );
};

const AppNavigator = () => {
  const { t } = useI18n();

  return (
    <NavigationContainer theme={appTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: t.app.homeTitle,
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerRight: () => <LanguageSwitch />,
          }}
        />
        <Stack.Screen
          name="MatchDetail"
          component={MatchDetailScreen}
          options={{
            title: t.app.matchDetailTitle,
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerRight: () => <LanguageSwitch />,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppNavigator />
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  langWrap: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 999,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  langBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  langText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  langTextActive: {
    color: '#0F172A',
  },
});
