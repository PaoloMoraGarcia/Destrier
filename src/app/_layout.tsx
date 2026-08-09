import { IBMPlexMono_300Light } from '@expo-google-fonts/ibm-plex-mono';
import {
  SpecialGothicExpandedOne_400Regular,
  useFonts,
} from '@expo-google-fonts/special-gothic-expanded-one';
import { Stack } from 'expo-router';
import * as NativeSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider } from '@/lib/session';
import { colors } from '@/theme';

// El splash nativo se mantiene hasta que la fuente del wordmark está lista: si se
// va antes, se ve un frame del wordmark con la tipografía del sistema.
NativeSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ SpecialGothicExpandedOne_400Regular, IBMPlexMono_300Light });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      NativeSplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}>
            {/* Entrar es una hoja modal: se pide cuando hace falta, no al abrir. */}
            <Stack.Screen
              name="sign-in"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
