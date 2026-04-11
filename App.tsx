import React, { useEffect, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import MatchDetailScreen from './src/screens/MatchDetailScreen';
import TeamScheduleScreen from './src/screens/TeamScheduleScreen';
import PlayerDetailScreen from './src/screens/PlayerDetailScreen';
import TeamPlayersScreen from './src/screens/TeamPlayersScreen';
import { I18nProvider, useI18n } from './src/i18n';
import * as Notifications from 'expo-notifications';
import { configureNotifications } from './src/services/notifications';
import AppErrorBoundary from './src/components/AppErrorBoundary';

export type RootStackParamList = {
  Home: undefined;
  MatchDetail: {
    eventId: string;
    league: string;
    homeName: string;
    awayName: string;
  };
  TeamSchedule: {
    teamId: string;
    teamName: string;
    league: string;
  };
  TeamPlayers: {
    teamId: string;
    teamName: string;
    league: string;
  };
  PlayerDetail: {
    league: string;
    playerId?: string;
    playerName: string;
    avatar?: string;
    form?: string;
    position?: string;
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
  const [open, setOpen] = useState(false);

  const options = [
    { value: 'vi' as const, label: `🇻🇳 ${t.common.languageVi}` },
    { value: 'ja' as const, label: `🇯🇵 ${t.common.languageJa}` },
  ];
  const active = options.find((item) => item.value === locale) || options[0];

  return (
    <View style={styles.langWrap}>
      <Pressable
        style={styles.langBtn}
        onPress={() => setOpen((prev) => !prev)}
        accessibilityLabel={t.common.languageToggle}
      >
        <Text style={styles.langText}>{active.label}</Text>
      </Pressable>
      {open ? (
        <View style={styles.langMenu}>
          {options.map((item) => (
            <Pressable
              key={item.value}
              style={[styles.langMenuItem, locale === item.value && styles.langMenuItemActive]}
              onPress={() => {
                setLocale(item.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.langMenuText, locale === item.value && styles.langMenuTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const TimeZoneSwitch = () => {
  const { timeZone, setTimeZone, t } = useI18n();
  const isVn = timeZone === 'Asia/Ho_Chi_Minh';

  return (
    <View style={styles.tzWrap}>
      <Pressable
        style={[styles.tzBtn, isVn && styles.tzBtnActive]}
        onPress={() => setTimeZone('Asia/Ho_Chi_Minh')}
        accessibilityLabel={t.common.timezoneVn}
      >
        <Text style={[styles.tzText, isVn && styles.tzTextActive]}>VN</Text>
      </Pressable>
      <Pressable
        style={[styles.tzBtn, !isVn && styles.tzBtnActive]}
        onPress={() => setTimeZone('Asia/Tokyo')}
        accessibilityLabel={t.common.timezoneJp}
      >
        <Text style={[styles.tzText, !isVn && styles.tzTextActive]}>JP</Text>
      </Pressable>
    </View>
  );
};

const AppNavigator = () => {
  const { t } = useI18n();
  useEffect(() => {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      void configureNotifications();
    } catch {
      // prevent startup crash when notification module fails in runtime
    }
  }, []);

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
            headerLeft: () => <TimeZoneSwitch />,
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
        <Stack.Screen
          name="TeamSchedule"
          component={TeamScheduleScreen}
          options={{
            title: t.team.scheduleTitle,
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerRight: () => <LanguageSwitch />,
          }}
        />
        <Stack.Screen
          name="TeamPlayers"
          component={TeamPlayersScreen}
          options={{
            title: t.team.playersTitle,
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerRight: () => <LanguageSwitch />,
          }}
        />
        <Stack.Screen
          name="PlayerDetail"
          component={PlayerDetailScreen}
          options={{
            title: t.player.title,
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerRight: () => <LanguageSwitch />,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <I18nProvider>
        <AppNavigator />
      </I18nProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  langWrap: {
    position: 'relative',
  },
  langMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 132,
    borderWidth: 1,
    borderColor: '#334155',
  },
  langMenuItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  langMenuItemActive: {
    backgroundColor: '#1E293B',
  },
  langMenuText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  langMenuTextActive: {
    color: '#FFFFFF',
  },
  langBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  langText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tzWrap: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 4,
    padding: 2,
    marginRight: 8,
  },
  tzBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tzBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tzText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  tzTextActive: {
    color: '#0F172A',
  },
});
