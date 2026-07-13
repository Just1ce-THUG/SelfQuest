import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'SelfQuest' }} />
        <Stack.Screen name="challenges/index" options={{ title: 'Challenges' }} />
        <Stack.Screen name="challenges/create" options={{ title: 'Create challenge' }} />
        <Stack.Screen name="challenges/[id]" options={{ title: 'Challenge details' }} />
      </Stack>
    </ThemeProvider>
  );
}
