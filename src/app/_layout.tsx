import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme, View } from 'react-native';
import { Slot } from 'expo-router'; 
import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{flex: 1, backgroundColor: '#0D0F11'}}>
        <AnimatedSplashOverlay />
        <Slot /> 
      </View>
    </ThemeProvider>
  );
}