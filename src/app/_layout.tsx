import { Stack } from "expo-router";
import { ThemeProvider, DarkTheme } from 'expo-router/react-navigation';
import { PaperProvider } from 'react-native-paper';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { restoreSession } from '@/lib/session';
import '@/i18n';

export default function RootLayout() {
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setSessionReady(true));
  }, []);

  const myTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: 'white',
    },
  };

  if (!sessionReady) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050B12' }}><ActivityIndicator color="white" /></View>;
  }

  return (
    <ThemeProvider value={myTheme}>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </ThemeProvider>
  )
}
