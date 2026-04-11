import React, { useEffect, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './src/screens/HomeScreen';
import MatchDetailScreen from './src/screens/MatchDetailScreen';
import TeamScheduleScreen from './src/screens/TeamScheduleScreen';
import PlayerDetailScreen from './src/screens/PlayerDetailScreen';
import TeamPlayersScreen from './src/screens/TeamPlayersScreen';
import LeaguesScreen from './src/screens/LeaguesScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { I18nProvider, useI18n } from './src/i18n';
import * as Notifications from 'expo-notifications';
import { configureNotifications } from './src/services/notifications';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import { colors, radius, shadows, spacing } from './src/theme/tokens';

export type MainTabParamList = {
  HomeTab: undefined;
  LeaguesTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
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
const Tab = createBottomTabNavigator<MainTabParamList>();

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    primary: colors.primary,
    border: colors.surfaceBorder,
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
      <Pressable style={styles.langBtn} onPress={() => setOpen((prev) => !prev)} accessibilityLabel={t.common.languageToggle}>
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
              <Text style={[styles.langMenuText, locale === item.value && styles.langMenuTextActive]}>{item.label}</Text>
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

const tabIcon = (routeName: keyof MainTabParamList): string => {
  if (routeName === 'HomeTab') return '◉';
  if (routeName === 'LeaguesTab') return '◎';
  if (routeName === 'FavoritesTab') return '★';
  return '◌';
};

const MainTabsNavigator = () => {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontWeight: '800' },
        headerTintColor: colors.text,
        headerRight: () => <LanguageSwitch />,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSoft,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 13, fontWeight: '800' }}>{tabIcon(route.name)}</Text>,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: t.app.homeTitle,
          tabBarLabel: 'Home',
          headerLeft: () => <TimeZoneSwitch />,
        }}
      />
      <Tab.Screen name="LeaguesTab" component={LeaguesScreen} options={{ title: 'Leagues', tabBarLabel: 'Leagues' }} />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{ title: t.home.myFavorites, tabBarLabel: 'Favorites' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={MainTabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="MatchDetail"
          component={MatchDetailScreen}
          options={{
            title: t.app.matchDetailTitle,
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTitleStyle: { color: colors.text, fontWeight: '800' },
            headerTintColor: colors.text,
            headerRight: () => <LanguageSwitch />,
          }}
        />
        <Stack.Screen
          name="TeamSchedule"
          component={TeamScheduleScreen}
          options={{
            title: t.team.scheduleTitle,
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTitleStyle: { color: colors.text, fontWeight: '800' },
            headerTintColor: colors.text,
            headerRight: () => <LanguageSwitch />,
          }}
        />
        <Stack.Screen
          name="TeamPlayers"
          component={TeamPlayersScreen}
          options={{
            title: t.team.playersTitle,
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTitleStyle: { color: colors.text, fontWeight: '800' },
            headerTintColor: colors.text,
            headerRight: () => <LanguageSwitch />,
          }}
        />
        <Stack.Screen
          name="PlayerDetail"
          component={PlayerDetailScreen}
          options={{
            title: t.player.title,
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTitleStyle: { color: colors.text, fontWeight: '800' },
            headerTintColor: colors.text,
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
    top: 44,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    minWidth: 152,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.md,
  },
  langMenuItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  langMenuItemActive: {
    backgroundColor: colors.primaryMid,
  },
  langMenuText: {
    color: colors.primaryMid,
    fontSize: 13,
    fontWeight: '700',
  },
  langMenuTextActive: {
    color: colors.white,
  },
  langBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  langText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  tzWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: '#93C5FD',
    marginRight: spacing.sm,
  },
  tzBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  tzBtnActive: {
    backgroundColor: colors.primary,
  },
  tzText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  tzTextActive: {
    color: colors.white,
  },
});
